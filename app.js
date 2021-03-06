angular.module('app',[])
.controller("chatCtrl", chatCtrl)
.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if(event.which === 13) {
                scope.$apply(function(){
                    scope.$eval(attrs.ngEnter, {'event': event});
                });

                event.preventDefault();
            }
        });
    };
    })
.directive('chatbox', function() {
   return {
       templateUrl: 'chatbox.html',
       restrict: 'E',
       controller: chatCtrl
    };
});
chatCtrl.$inject = ["$scope", '$location', '$anchorScroll'];
function chatCtrl($scope, $location, $anchorScroll) {

    var self = this;
    init();


    function init() {
        $scope.sendMessage = sendMessage;
        $scope.isLoading = true;
        $scope.$safeApply = safeApply;
        $scope.signOut = signOut;
        $scope.signedIn = true;
        $scope.btnLoginEmail = loginEmail;
        $scope.btnLoginRegister = loginRegister;
        $scope.showEditTopic = showEditTopic;
        $scope.editTopic = editTopic;
        $scope.chatEditTopic = false;
        var config = {
            apiKey: "AIzaSyBXL-rNE_oAIrpKasYYvJYNvSgxsqtNOSg",
            authDomain: "tw1ll-a7f80.firebaseapp.com",
            databaseURL: "https://tw1ll-a7f80.firebaseio.com",
            storageBucket: "tw1ll-a7f80.appspot.com",
            messagingSenderId: "360849592984"
        };
        self.fb = firebase.initializeApp(config);
        self.database = self.fb.database();
        self.fb.auth().onAuthStateChanged(function (user) {
            if (user) {
                connect(user.email.split('@')[0]);
            } else {
                disconnect();
            }
        });
    }
    function showEditTopic() {
        $scope.chatEditTopic = true;
    }
    function editTopic() {
        self.database.ref("chats/"+$scope.chatId).set($scope.chat.info);
        $scope.chatEditTopic = false;
    }
    function loginEmail() {
        self.fb.auth().signInWithEmailAndPassword($scope.loginEmail, $scope.loginPass).catch(
        function(error) {
            if (error) {
                console.log(error);
            }
        });
    }
    function loginRegister() {
        console.log('registering...');
        self.fb.auth().createUserWithEmailAndPassword($scope.loginEmail, $scope.loginPass).catch(function(error) {
            if (error) {
                console.log(error);
            }
        });
    }
    function sendMessage() {
        if(typeof $scope.chatMessage !== "undefined" && $scope.chatMessage != "")
        writeMessage($scope.chatId, $scope.userName, $scope.chatMessage, true);
        $scope.chatMessage = "";
    }

    function signOut() {
        self.fb.auth().signOut();
        disconnect();
    }



    function connect(user, chatId) {
        $scope.userName = user;
        $scope.signedIn = true;
        $scope.chatId = "1f3e4957-c8e6-47d1-a9b6-95413f300ddb"; // For now
        retreiveChat($scope.chatId);

    }
    function disconnect() {
        $scope.signedIn = false;
        $scope.chatId = "";
        $scope.chat = "";
        $scope.isLoading = true;
    }

    function retreiveChat(chatId) {
        $scope.chat = { info : {}, messages : {}};
        self.database.ref("messages/"+chatId).once('value').then(function(data) {
            $scope.$safeApply(function() {
                $scope.isLoading = false;
                $scope.chat.messages = data.val();
                $location.hash(Object.keys($scope.chat.messages)[Object.keys($scope.chat.messages).length-1])
                $anchorScroll();
            });
        });
        self.database.ref("chats/"+chatId).on('value', function(data) {
            $scope.$safeApply(function() {
                $scope.chat.info = data.val();
            });
        });
        self.database.ref("messages/"+chatId).on('child_added', function(data) {
            $scope.$safeApply(function() {
                $scope.chat.messages[data.key] = data.val();
            });
            $location.hash(data.key);
            $anchorScroll();

        });
    }

    function writeMessage(chatId, user, message, isClient) {
        self.database.ref('chats/' + chatId).set({
            lastMessage: message,
            timestamp: Date.now(),
            status: true,
            topic: $scope.chat.info.topic
        });
        self.database.ref("messages/" + chatId).push({
            sender: user,
            message: message,
            "timestamp": Date.now(),
            "isClient": isClient
        });

    }

    function createChat(topic, user) {
        var chatId = uuid();
        console.log(chatId);
        self.database.ref('chats/' + chatId).set({
            lastMessage: "",
            timestamp: Date.now(),
            topic: topic,
            status: true
        });
        self.database.ref('members/' + chatId).set({
            them: user,
            us: "admin"
        });
        self.database.ref('messages/' + chatId).set([]);
        return chatId;
    }

    function uuid() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    }

    function safeApply(fn) {
            var phase = this.$root.$$phase;
            if(phase == '$apply' || phase == '$digest') {
                if(fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
    }

}
