// 迷你 WebSocket 服务器（仅 stdlib，够本页数据桥用）。
// 支持：握手、文本帧收发、ping/pong、close；客户端帧自动去掩码。
import http from 'node:http';
import crypto from 'node:crypto';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function readFrame(buf) {
  if (buf.length < 2) return null;
  const b1 = buf[1];
  const opcode = buf[0] & 0x0f;
  const masked = (b1 & 0x80) !== 0;
  let len = b1 & 0x7f;
  let off = 2;
  if (len === 126) {
    if (buf.length < 4) return null;
    len = buf.readUInt16BE(2);
    off = 4;
  } else if (len === 127) {
    if (buf.length < 10) return null;
    len = Number(buf.readBigUInt64BE(2));
    off = 10;
  }
  const maskOff = off;
  if (masked) off += 4;
  if (buf.length < off + len) return null;
  let payload = buf.subarray(off, off + len);
  if (masked) {
    const mask = buf.subarray(maskOff, maskOff + 4);
    const un = Buffer.from(payload);
    for (let i = 0; i < un.length; i++) un[i] ^= mask[i & 3];
    payload = un;
  }
  return { opcode, payload, total: off + len };
}

function encodeText(str) {
  const payload = Buffer.from(str, 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) header = Buffer.from([0x81, len]);
  else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function controlFrame(opcode, payload = Buffer.alloc(0)) {
  if (payload.length < 126) return Buffer.concat([Buffer.from([0x80 | opcode, payload.length]), payload]);
  const header = Buffer.alloc(4);
  header[0] = 0x80 | opcode;
  header[1] = 126;
  header.writeUInt16BE(payload.length, 2);
  return Buffer.concat([header, payload]);
}

export function startWSServer(port, { onMessage, onStatus, onError } = {}) {
  const clients = new Set();
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('avatar-printer data bridge running');
  });
  server.on('error', err => { if (onError) onError(err); });
  server.on('upgrade', (req, sock) => {
    const key = req.headers['sec-websocket-key'];
    if (!key || String(req.headers.upgrade || '').toLowerCase() !== 'websocket') {
      sock.destroy();
      return;
    }
    const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
    sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
    sock.setNoDelay(true);
    const client = { sock, buf: Buffer.alloc(0) };
    clients.add(client);
    sock.on('data', d => {
      client.buf = Buffer.concat([client.buf, d]);
      let frame;
      while ((frame = readFrame(client.buf))) {
        client.buf = client.buf.subarray(frame.total);
        if (frame.opcode === 8) {
          try { sock.end(controlFrame(8)) } catch { }
          clients.delete(client);
          return;
        } else if (frame.opcode === 9) {
          try { sock.write(controlFrame(10, frame.payload)) } catch { }
        } else if (frame.opcode === 1 && onMessage) {
          try { onMessage(frame.payload.toString('utf8'), client) } catch { }
        }
      }
    });
    const drop = () => clients.delete(client);
    sock.on('close', drop);
    sock.on('error', drop);
  });
  server.on('clientError', () => { });
  function broadcast(obj) {
    const data = encodeText(JSON.stringify(obj));
    for (const c of [...clients]) {
      try { c.sock.write(data) } catch { clients.delete(c) }
    }
  }
  server.listen(port, () => { if (onStatus) onStatus(port) });
  return {
    broadcast,
    clientCount: () => clients.size,
    close: () => server.close()
  };
}
