async function loadChat() {

    const response =
        await fetch("/api/chat/history");

    const messages =
        await response.json();

    const chatBox =
        document.getElementById("chat-box");

    chatBox.innerHTML = "";

    messages.forEach(message => {

        const div =
            document.createElement("div");

        div.textContent = message;

        chatBox.appendChild(div);
    });

    chatBox.scrollTop =
        chatBox.scrollHeight;
}


async function sendMessage() {

    const input =
        document.getElementById("message");

    const message =
        input.value.trim();

    if (!message) {
        return;
    }

    await fetch("/api/chat/send", {

        method: "POST",

        headers: {
            "Content-Type":
                "application/json"
        },

        body: JSON.stringify({
            message: message
        })

    });

    input.value = "";

    loadChat();
}


async function loadUsers() {

    const response =
        await fetch("/api/users");

    const users =
        await response.json();

    const onlineBox =
        document.getElementById("online-users");

    const offlineBox =
        document.getElementById("offline-users");

    if (!onlineBox || !offlineBox) {
        return;
    }

    onlineBox.innerHTML = "";
    offlineBox.innerHTML = "";

    users.forEach(user => {

        const div =
            document.createElement("div");

        div.className =
            user.online
                ? "user online"
                : "user offline";

        div.textContent =
            user.online
                ? "🟢 User " + user.id
                : "⚫ User " + user.id;

        if (user.online) {

            div.onclick = function () {

                console.log(
                    "Selected User " + user.id
                );

                // Private DM sẽ làm sau
            };

            onlineBox.appendChild(div);

        } else {

            offlineBox.appendChild(div);
        }

    });

}


/* Start Bro Network Chat */

loadChat();
loadUsers();

setInterval(loadChat, 2000);
setInterval(loadUsers, 5000);
