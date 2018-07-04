"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SESSION_STATES;
(function (SESSION_STATES) {
    SESSION_STATES[SESSION_STATES["NEW"] = 0] = "NEW";
    SESSION_STATES[SESSION_STATES["ACTIVE"] = 1] = "ACTIVE";
    SESSION_STATES[SESSION_STATES["INACTIVE"] = 2] = "INACTIVE";
    SESSION_STATES[SESSION_STATES["CLOSED"] = 3] = "CLOSED";
})(SESSION_STATES || (SESSION_STATES = {}));
class Session {
    constructor() {
        this.state = SESSION_STATES.NEW;
        this.teamId = '';
        this.mazeId = '';
    }
}
//# sourceMappingURL=Session.js.map