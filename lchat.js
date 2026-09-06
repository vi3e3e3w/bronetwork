const dmMatch =
    window.location.pathname.match(
        /^\/lchat\.html\/ID=@(\d+)$/
    );

const dmTarget =
    dmMatch ? dmMatch[1] : null;

let currentUserId = null;

async function loadCurrentUser() {

    const response =
        await fetch("/api/me");

    const me =
        await response.json();

    currentUserId =
        me.id;
}

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

        if (String(user.id) === String(currentUserId)) {

            div.classList.add("self");

            div.textContent =
                (user.online ? "🟢 " : "⚫ ") +
                "User " + user.id + " (You)";

        } else if (user.online) {

            div.onclick = function () {

                window.location.href =
                    `/lchat.html/ID=@${user.id}`;

            };

        }

        if (user.online) {

            onlineBox.appendChild(div);

        } else {

            offlineBox.appendChild(div);

        }

    });

}

async function sendDM(targetId) {

    const input =
        document.getElementById("message");

    const message =
        input.value.trim();

    if (!message) {
        return;
    }

    await fetch(`/api/dm/${targetId}`, {

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

    loadDM(targetId);
}

async function loadDM(targetId) {

    const response =
        await fetch(`/api/dm/${targetId}`);

    const messages =
        await response.json();

    const chatBox =
        document.getElementById("chat-box");

    const chatTitle =
        document.getElementById("chat-title");

    const backButton =
        document.getElementById("back-general");

    if (chatTitle) {
        chatTitle.textContent =
            `PRIVATE: User ${targetId}`;
    }

    if (backButton) {
        backButton.style.display =
            "inline-block";
    }

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


/* Start Bro Network Chat */

loadCurrentUser().then(() => {

    if (dmTarget) {

        loadDM(dmTarget);

        setInterval(
            () => loadDM(dmTarget),
            2000
        );

    } else {

        loadChat();

        setInterval(
            loadChat,
            2000
        );
    }

    loadUsers();

    setInterval(
        loadUsers,
        5000
    );

});
