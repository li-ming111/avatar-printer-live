"""Bounded, local-only signalling for separately isolated WebView profiles."""
from collections import deque
from threading import Condition
import time

class SceneRelay:
    def __init__(self):
        self.condition = Condition()
        self.sequence = 0
        self.events = deque(maxlen=256)

    def publish(self, client, message):
        if not isinstance(client, str) or not 1 <= len(client) <= 80:
            raise ValueError('bad client')
        if not isinstance(message, dict) or message.get('type') not in {
            'view-request','view-offer','view-answer','view-ice','view-ping',
            'view-ready','view-bye','view-size','view-stats','view-camera',
            'view-camera-request','view-camera-change'}:
            raise ValueError('bad message')
        with self.condition:
            self.sequence += 1
            self.events.append((self.sequence, client, message))
            self.condition.notify_all()

    def poll(self, client, after=None, timeout=15):
        with self.condition:
            if after is None:
                return {'cursor':self.sequence, 'messages':[]}
            deadline = time.monotonic() + timeout
            while self.sequence <= after and time.monotonic() < deadline:
                self.condition.wait(max(0, deadline-time.monotonic()))
            return {'cursor':self.sequence,
                'messages':[m for n,c,m in self.events if n>after and c!=client]}
