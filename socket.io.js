src/sockets/server.js

"use strict";
var appRoot = require('app-root-path');

var logger = require(appRoot + '/helpers/library/wintson');
const properties = require('properties-reader')(appRoot + '/resources/properties.ini')

const socketPort = process.env.SOCKET_PORT || properties.get('MAIN.SOCKET.PORT');

global.io = require('socket.io').listen(socketPort);
logger.info("Custom - Socket listening at - " + socketPort);

var basePathSocketModules = appRoot + '/sockets/modules/'
require(basePathSocketModules + 'chat')
require(basePathSocketModules + 'notifications')


======================


src/sockets/modules.notification.js

"use strict";

var io = global.io
var people = {}


var notify = io.of('/notify').on('connection', function (socket) {

    var userName = socket.handshake.query.username
    console.log(`Connected to ${socket.id}`);
    people[userName] = socket.id;

    socket.on('notifyTo', function (notifyUsers) {
        notifyUsers.forEach(function (value) {
            if (people[value] != undefined && people[value] != '' && people[value] != null){
                notify.to(people[value]).emit('getNotification', { message: "You have new notification" });
                // noificationController.getLatestNotification(value, notify, people[value])
            }
               
        });
    });

    socket.on('disconnect', function (reason) {
        console.log(reason);
        console.log("Disconnected");
    });
})

module.exports = io


=============================
ecosystem.config.js

if (nodeEnv == "development") {
  var watch = true
  var ignoreWatchIn = ["node_modules", "logs", "data"]
  appPlatform.push({
    name: 'lms-api',
    script: 'server.js',
    watch: watch,
    ignore_watch: ignoreWatchIn,
    env: {
      NODE_ENV: nodeEnv
    }
  }, {
      name: 'lms-socket',
      script: 'sockets/server.js',
      watch: watch,
      ignore_watch: ignoreWatchIn,
      env: {
        NODE_ENV: nodeEnv
      }
    }, {
      name: 'lms-watcher',
      script: 'watcher/server.js',
      watch: watch,
      ignore_watch: ignoreWatchIn,
      env: {
        NODE_ENV: nodeEnv
      }
    })


===========================


properties.ini

#Add any constants here 
## Server Details

[MAIN]
SERVER.PORT = 3000
SOCKET.PORT = 3002
WATCHER.PORT = 3003
LOCAL.URL = 127.0.0.1
TIME.ZONE = Asia/Calcutta
## NODE_ENV should be 'development' or 'production'
NODE_ENV = development

[PRODUCTION]
#for initail script purpose
ENV_MONGO_URLS = mongodb://35.200.199.120:3001/meteor mongodb://35.200.199.120:3201/meteor
#total of the environment need to be run
#can add multi env for api server
ENV.COUNT = 2
#first server details
ENV.1.MONGO.URL = mongodb://35.200.199.120:3001/meteor
ENV.1.MONGO.OPLOG_URL = mongodb://35.200.199.120:3001/local
ENV.1.SERVER.PORT = 3500
ENV.1.SOCKET.PORT = 3501
ENV.1.WATCHER.PORT = 3502
ENV.1.PROCESS.NAME = lms-india
ENV.1.SITE.URL = http://example.com
#second server details
ENV.2.MONGO.URL = mongodb://35.200.199.120:3201/meteor
ENV.2.MONGO.OPLOG_URL = mongodb://35.200.199.120:3201/local
ENV.2.SERVER.PORT = 3600
ENV.2.SOCKET.PORT = 3601
ENV.2.WATCHER.PORT = 3602
ENV.2.PROCESS.NAME = lms-uae
ENV.2.SITE.URL = http://example.com

[DB]
## set 0 for dont run and 1 for run, 
## if set it as 0, will look for mongo_url, 
## otherwise will take mongo_port to auto start the mongo server
## only change mongo_run for production, others are for dev env
MONGO_RUN = 0
MONGO_URL = mongodb://35.200.199.120:3001/meteor
; MONGO_URL = mongodb://192.168.0.42:8085/meteor
MONGO_OPLOG_URL = mongodb://35.200.199.120:3001/local
MONGO_DB = meteor
MONGO_PORT = 3001

## configaration for _v(Apis for internal purpose) config
[_V_CONFIG]
; api auth token for internal audit log api calling
AUTH_TOKEN = tq355lY3MJyd8Uj2ySzmfed

## configaration for v0(Apis for meteor application) config
[V0_CONFIG]
; quick exam apis dev configs(route will be /v0/..)
AUTH_TOKEN = tq355lY3MJyd8Uj2ySzm

[LOG]
LOCATION = logs/application

[SITEINFO]
SITE.URL = http://192.168.0.11:8080
EDUCORE_MAIL = educore@cordovacloud.com
EDUCORE_MAIL_PASSWORD = eduCore123!@
PRINCIPAL_EMAIL_ID = naveen@cordovacloud.com
FILE_UPLOAD_URL = http://104.199.95.46:4000

[DEBUG]
; can hide all logger output, if conosle.log set to 0(it is hiding by default in production mode)
DISPLAY.CONSOLE.LOGS = 1
; to display audit log output in watcher project
DISPLAY.AUDIT.LOGS = 0
DISPLAY.REQUEST = 1
DISPLAY.RESPONSE = 0
MONGOOSE.DEBUG = 0

[ERROR_DEBUG_MAIL]
; use comma separated format for adding new mail ids
ERROR_MAIL_ID = naveen@cordovacloud.com, naveen.nn2@gmail.com
ERROR_SEND_ENV = production
ERROR_SEND_LEVEL = error

[GENERAL]
RANDOM_ID.LENGTH = 32

[THIRD_PARTY]
DOCME.URL = https://portal.oxford.edu.in/index.php/portal_data_contract/
DOCME.TOKEN = d8ba88f080664a1420d2d080b658fc04
DOCME.API_SUCCESS = 200

[PAGINATION]
BASIC.LIMIT = 10

[FCM_KEYS]
IONIC_KEY = AIzaSyAgUBPfToIMn2X1uidAYnP9QfUNjX7tGM0


=====================


Notification.server.js

"user strict";
const appRoot = require('app-root-path');
const properties = require('properties-reader')(appRoot + '/resources/properties.ini');
const DBCONSTANTS = require(appRoot + '/resources/db_constants.json');
const FCM = require('fcm-node');
const fcmForIonic = new FCM(properties.get('FCM_KEYS.SERVER_KEY'));
const socket = require('socket.io-client')('http://localhost:' + properties.get('MAIN.SOCKET.PORT') + '/notify');

exports.sentNotification = function (Notifications, title, message, userId, recipients, type, references, iconType, custom) {
    try {
        var notificationData = {};
        notificationData.recipient = {
            _id: recipients
        };
        if (references != null) {
            notificationData.references = references
        };
        notificationData.type = type;
        notificationData.icon_type = iconType;
        notificationData.status = DBCONSTANTS.MODELS.NOTIFICATIONS.STATUS.ACTIVE;
        notificationData.msg = message + " - " + title;
        notificationData['gen-date'] = new Date();
        notificationData.sender_id = userId;
        /* Added for identifying applications which can access notifications */
        notificationData.custom = custom ? custom : [DBCONSTANTS.MODELS.NOTIFICATIONS.CUSTOM.WEB_APP];
        var NotificationObj = new Notifications(notificationData);
        NotificationObj.save()
            .then(function (notificationDet) {
                socket.emit('notifyTo', notificationDet);
                return notificationDet
            })
            .catch(function (err) {
                return err
            });
    } catch (err) {
        return err
    }
};

exports.sentFCMNotificationForIonic = async function sendNotificationForUser(User, title, msg, category, userIds, isStudent) {
    // if (isStudent)
    //     var tokens = await getChildFCMNotificationTokens(User, userIds)
    // else
    //     var tokens = await getParentFCMNotificationTokens(User, userIds)
    // if (tokens.length) {
    //     tokens[0].notification_ids.forEach(function (notiId) {
            var messageForIonic = {
                to: "5d88ccfa2a9fe81d992af7cc",
                "priority": "high",
                data: {
                    title: title,
                    message: msg,
                    category: category,
                    "content-available": 1
                },
                notification: {
                    title: title,
                    category: category,
                    body: msg,
                    sound: "default",
                    click_action: "FCM_PLUGIN_ACTIVITY",
                }
            };
            fcmForIonic.send(messageForIonic, function (err, response) {
                if (err) {
                    return err;
                } else {
                    return response;
                }
            });
    //     });
    // } else {
    //     return 'No tokens'
    // }
};

===

"socket.io": "^2.1.1",

