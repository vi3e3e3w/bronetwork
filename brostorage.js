// ==============================
// BROSTORAGE
// ==============================

const fileList = document.getElementById("file-list");
const fileInput = document.getElementById("file-input");
const uploadButton = document.getElementById("upload-button");
const fileCount = document.getElementById("file-count");


// ------------------------------
// Format file size
// ------------------------------

function formatFileSize(bytes) {

    if (bytes < 1024)
        return `${bytes} B`;

    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;

    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}


// ------------------------------
// Escape HTML
// ------------------------------

function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ------------------------------
// Load files
// ------------------------------

async function loadBroStorage() {

    if (!fileList)
        return;

    fileList.textContent = "Loading...";

    try {

        const response = await fetch(
            "/api/brostorage/files"
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Failed to load files"
            );
        }


        const files = data.files || [];

        if (fileCount) {
            fileCount.textContent = files.length;
        }


        fileList.innerHTML = "";


        if (files.length === 0) {

            fileList.innerHTML = `
                <div class="empty-storage">
                    No files here yet 📦
                </div>
            `;

            return;
        }


        for (const file of files) {

            const item =
                document.createElement("div");

            item.className = "storage-file";


            item.innerHTML = `
                <div class="file-info">

                    <span class="file-name">
                        ${escapeHTML(file.name)}
                    </span>

                    <span class="file-size">
                        ${formatFileSize(file.size)}
                    </span>

                </div>

                <div class="file-actions">

                    <button
                        type="button"
                        class="download-file"
                        data-file="${escapeHTML(file.name)}"
                    >
                        Download
                    </button>

                    <button
                        type="button"
                        class="delete-file"
                        data-file="${escapeHTML(file.name)}"
                    >
                        Delete
                    </button>

                </div>
            `;


            fileList.appendChild(item);
        }


    } catch (error) {

        console.error(
            "BroStorage:",
            error
        );

        fileList.innerHTML = `
            <div class="storage-error">
                Failed to load BroStorage.
            </div>
        `;
    }
}


// ------------------------------
// Upload
// ------------------------------

async function uploadBroFile(file) {

    if (!file)
        return;


    const formData = new FormData();

    formData.append(
        "file",
        file
    );


    try {

        const response = await fetch(
            "/api/brostorage/upload",
            {
                method: "POST",
                body: formData
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "Upload failed"
            );
        }


        await loadBroStorage();


    } catch (error) {

        console.error(
            "BroStorage upload:",
            error
        );

        broDialog(
            `Oppsy daisy, error has occurred: ${error.message}. If this error is from me, report it on GitHub.`
        );
    }
}


// ------------------------------
// Download
// ------------------------------

function downloadBroFile(filename) {

    const url =
        "/api/brostorage/download/" +
        encodeURIComponent(filename);

    window.location.href = url;
}


// ------------------------------
// Delete
// ------------------------------

async function deleteBroFile(filename) {

    try {

        const response = await fetch(
            "/api/brostorage/delete/" +
            encodeURIComponent(filename),
            {
                method: "DELETE"
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "Delete failed"
            );
        }


        await loadBroStorage();


    } catch (error) {

        console.error(
            "BroStorage delete:",
            error
        );

        broDialog(
            `Oppsy daisy, error has occurred: ${error.message}. If this error is from me, report it on GitHub.`
        );
    }
}


// ------------------------------
// Upload button
// ------------------------------

if (uploadButton && fileInput) {

    uploadButton.addEventListener(
        "click",
        () => {

            fileInput.click();

        }
    );


    fileInput.addEventListener(
        "change",
        async () => {

            const file =
                fileInput.files[0];

            if (!file)
                return;

            await uploadBroFile(file);

            fileInput.value = "";
        }
    );
}


// ------------------------------
// File actions
// ------------------------------

if (fileList) {

    fileList.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest("button");

            if (!button)
                return;


            const filename =
                button.dataset.file;

            if (!filename)
                return;


            if (
                button.classList.contains(
                    "download-file"
                )
            ) {

                downloadBroFile(filename);

                return;
            }


            if (
                button.classList.contains(
                    "delete-file"
                )
            ) {

                deleteBroFile(filename);

            }

        }
    );
}


// ------------------------------
// Start
// ------------------------------

document.addEventListener(
    "DOMContentLoaded",
    loadBroStorage
);
