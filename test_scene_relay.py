import unittest
from scene_relay import SceneRelay

class RelayTests(unittest.TestCase):
    def test_isolated_clients_receive_peer_messages_only(self):
        r=SceneRelay();self.assertEqual(r.poll('main')['cursor'],0)
        r.publish('main',{'type':'view-offer','sdp':{'type':'offer','sdp':'test'}})
        r.publish('view',{'type':'view-answer','sdp':{'type':'answer','sdp':'test'}})
        self.assertEqual([m['type'] for m in r.poll('main',0,0)['messages']],['view-answer'])
        self.assertEqual([m['type'] for m in r.poll('view',0,0)['messages']],['view-offer'])
    def test_new_client_does_not_replay_stale_offer(self):
        r=SceneRelay();r.publish('main',{'type':'view-offer'})
        self.assertEqual(r.poll('new'),{'cursor':1,'messages':[]})
    def test_bounded_history_and_valid_types(self):
        r=SceneRelay()
        for _ in range(300):r.publish('main',{'type':'view-ping'})
        self.assertEqual(len(r.poll('view',0,0)['messages']),256)
        with self.assertRaises(ValueError):r.publish('bad',{'type':'execute'})
if __name__=='__main__':unittest.main()
