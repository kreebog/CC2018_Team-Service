"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
// console output colors
var COLORS;
(function (COLORS) {
    COLORS["NONE"] = "\u001B[49m\u001B[0m";
    COLORS["RED"] = "\u001B[49m\u001B[31m";
    COLORS["YELLOW"] = "\u001B[49m\u001B[35m";
    COLORS["BLUE"] = "\u001B[49m\u001B[36m";
    COLORS["MAGENTA"] = "\u001B[49m\u001B[35m";
    COLORS["WHITE_ON_RED"] = "\u001B[41m\u001B[37m";
    COLORS["RED_UNDERLINE"] = "\u001B[4m\u001B[37m";
})(COLORS || (COLORS = {}));
var LOG_LEVELS;
(function (LOG_LEVELS) {
    LOG_LEVELS[LOG_LEVELS["NONE"] = 0] = "NONE";
    LOG_LEVELS[LOG_LEVELS["ERROR"] = 1] = "ERROR";
    LOG_LEVELS[LOG_LEVELS["WARN"] = 2] = "WARN";
    LOG_LEVELS[LOG_LEVELS["INFO"] = 3] = "INFO";
    LOG_LEVELS[LOG_LEVELS["DEBUG"] = 4] = "DEBUG";
    LOG_LEVELS[LOG_LEVELS["TRACE"] = 5] = "TRACE";
})(LOG_LEVELS = exports.LOG_LEVELS || (exports.LOG_LEVELS = {}));
let logLevel = LOG_LEVELS.INFO;
// returns the current timestamp
function getTimeStamp() {
    var dt = new Date();
    return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString();
}
// strips path and returns just the name (and extension) of the file
function fileName(file) {
    return typeof file !== 'undefined' ? path_1.default.basename(file) : 'FILE_UNKNOWN';
}
function setLogLevel(level) {
    logLevel = level;
    info(__filename, 'setLogLevel(' + level + ')', 'Log level set to ' + LOG_LEVELS[level]);
}
exports.setLogLevel = setLogLevel;
function debug(file, method, message) {
    if (logLevel >= LOG_LEVELS.DEBUG) {
        console.log('%s%s : %s : %s' + (method == '' ? '' : ' : ') + '%s : %s%s', COLORS.BLUE, getTimeStamp(), 'DEBUG', fileName(file), method, message, COLORS.NONE);
    }
}
exports.debug = debug;
function error(file, method, message) {
    if (logLevel >= LOG_LEVELS.ERROR) {
        console.log('%s%s : %s : %s' + (method == '' ? '' : ' : ') + '%s : %s%s', COLORS.RED, getTimeStamp(), 'ERROR', fileName(file), method, message, COLORS.NONE);
    }
}
exports.error = error;
function warn(file, method, message) {
    if (logLevel >= LOG_LEVELS.WARN) {
        console.log('%s%s : %s : %s' + (method == '' ? '' : ' : ') + '%s : %s%s', COLORS.YELLOW, getTimeStamp(), 'WARN', fileName(file), method, message, COLORS.NONE);
    }
}
exports.warn = warn;
function info(file, method, message) {
    if (logLevel >= LOG_LEVELS.INFO) {
        console.log('%s%s : %s : %s' + (method == '' ? '' : ' : ') + '%s : %s%s', COLORS.NONE, getTimeStamp(), 'INFO', fileName(file), method, message, COLORS.NONE);
    }
}
exports.info = info;
function trace(file, method, message) {
    if (logLevel >= LOG_LEVELS.TRACE) {
        console.log('%s%s : %s : %s' + (method == '' ? '' : ' : ') + '%s : %s', COLORS.MAGENTA, getTimeStamp(), 'TRACE', fileName(file), method, message, COLORS.NONE);
    }
}
exports.trace = trace;
//# sourceMappingURL=Logger.js.map