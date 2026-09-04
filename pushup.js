async function loadPushUpUsers() {

    try {

        const response = await fetch("/api/users");
        const users = await response.json();

        const myId = document.getElementById("my-id");
        const select = document.getElementById("target-user");

        select.innerHTML = "";

        const meResponse =
            await fetch("/api/me");

        const me =
            await meResponse.json();

        const currentUser =
            users.find(
                user => user.id === me.id
            );


        if (currentUser) {
            myId.textContent = currentUser.id;
        } else {
            myId.textContent = "Unknown";
        }

        users.forEach(user => {

            if (user.id === currentUser?.id) {
                return;
            }

            const option =
                document.createElement("option");

            option.value = user.id;

            option.textContent =
                "User " + user.id;

            select.appendChild(option);

        });

        if (select.children.length === 0) {

            const option =
                document.createElement("option");

            option.textContent =
                "No other users";

            select.appendChild(option);

        }

    } catch (error) {

        console.error(
            "Unable to load users:",
            error
        );

    }

}


async function uploadFile() {

    const fileInput =
        document.getElementById("fileInput");

    const result =
        document.getElementById("result");

    const target =
        document.getElementById("target-user");

    if (!fileInput.files.length) {

        result.textContent =
            "Select a file first.";

        return;
    }

    const formData =
        new FormData();

    formData.append(
        "file",
        fileInput.files[0]
    );

    formData.append(
        "target",
        target.value
    );

    result.textContent =
        "Uploading...";

    try {

        const response =
            await fetch(
                "/upload",
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await response.json();

        result.textContent =
            data.message || data.error;

    } catch (error) {

        result.textContent =
            "Upload failed.";

    }

}


loadPushUpUsers();

async function loadInbox() {

    const inbox =
        document.getElementById("inbox");

    try {

        const response =
            await fetch(
                "/api/pushup/inbox"
            );

        const files =
            await response.json();

        inbox.innerHTML = "";

        if (!files.length) {

            inbox.textContent =
                "No files.";

            return;
        }

        files.forEach(file => {

            const item =
                document.createElement("div");

            const link =
                document.createElement("a");

            link.href = file.url;

            link.textContent =
                "📄 " + file.filename;

            link.download =
                file.filename;

            item.appendChild(link);

            inbox.appendChild(item);

        });

    } catch (error) {

        console.error(error);

        inbox.textContent =
            "Unable to load inbox.";

    }

}

loadPushUpUsers();
loadInbox();

setInterval(
    loadInbox,
    5000
);
