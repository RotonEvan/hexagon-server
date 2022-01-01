module.exports = class Node {
    constructor(node_id, peers, peers_list, slots, websocket) {
        this.node_id = node_id;
        this.peers = peers;
        this.peers_list = peers_list;
        this.slots = slots;
        this.websocket = websocket;
    }

    // getters

    getID() {
        return this.node_id;
    }

    getPeersCount() {
        return this.peers;
    }

    getPeersList() {
        return this.peers_list;
    }

    getSlots() {
        return this.slots;
    }

    getWebsocket() {
        return this.websocket;
    }

    // setters

    setID(node_id) {
        this.node_id = node_id;
    }

    decreasePeers(i) {
        this.peers -= i;
    }

    increasePeers(i) {
        this.peers += i;
    }

    addPeer(node) {
        this.peers_list.push(node);
        this.increasePeers(1);
    }

    removePeer(node) {
        this.peers_list.splice(this.peers_list.indexOf(node), 1);
        this.decreasePeers(1);
    }

    addPeers(nodes) {
        this.peers_list.push(...nodes);
        this.increasePeers(nodes.length);
    }

    removePeers(nodes) {
        nodes.forEach(node => {
            this.removePeer(node);
        });
    }
}