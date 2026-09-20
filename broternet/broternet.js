console.log("BROTERNET ONLINE 📡");
console.log("Meet you at the Net");
console.log("Powered by Bro Network");


// ========================================================
// POSTS
// ========================================================

const newPostButton =
    document.getElementById("new-post");

const postForm =
    document.getElementById("post-form");


if (newPostButton && postForm) {

    newPostButton.addEventListener(
        "click",
        () => {

            postForm.style.display =
                postForm.style.display === "none"
                    ? "block"
                    : "none";

        }
    );

}


async function loadPosts() {

    const postsContainer =
        document.getElementById("posts");

    if (!postsContainer) {
        return;
    }

    try {

        const response =
            await fetch(
                "/api/broternet/posts"
            );

        const posts =
            await response.json();

        postsContainer.innerHTML = "";


        if (!posts.length) {

            postsContainer.textContent =
                "No posts yet.";

            return;

        }


        posts.forEach(async post => {

            const postElement =
                document.createElement("article");

            postElement.className =
                "post";


            const title =
                document.createElement("h3");

            title.textContent =
                post.title;


            const content =
                document.createElement("p");

            content.textContent =
                post.content;


const info =
    document.createElement("small");

info.textContent =
    "User " +
    (post.user_id || post.id) +
    " • " +
    post.date;

postElement.appendChild(title);
postElement.appendChild(content);
postElement.appendChild(info);


// ========================================================
// POST ACTIONS
// ========================================================

const actions =
    document.createElement("div");

actions.className =
    "post-actions";


const likeButton =
    document.createElement("button");

likeButton.className =
    "post-action like-button";

likeButton.type =
    "button";

likeButton.textContent =
    "❤️ 0";

try {

    const likeResponse =
        await fetch(
            "/api/broternet/posts/" +
            post.id +
            "/like"
        );

    const likeData =
        await likeResponse.json();

    if (likeResponse.ok) {

        likeButton.textContent =
            "❤️ " +
            likeData.count;

    }

} catch (error) {

    console.error(
        "Unable to load likes:",
        error
    );

}


likeButton.addEventListener(
    "click",
    async () => {

        try {

            const response =
                await fetch(
                    "/api/broternet/posts/" +
                    post.id +
                    "/like",
                    {
                        method: "POST"
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                console.error(
                    "Like failed:",
                    data
                );
                return;
            }

            likeButton.textContent =
                "❤️ " + data.count;

        } catch (error) {

            console.error(
                "Unable to like post:",
                error
            );

        }

    }
);
const deleteButton =
    document.createElement("button");

deleteButton.className =
    "post-action delete-button";

deleteButton.type =
    "button";

deleteButton.textContent =
    "🗑️ Del Post";
deleteButton.addEventListener(
    "click",
    async () => {

        try {

            const response =
                await fetch(
                    "/api/broternet/posts/" +
                    post.id,
                    {
                        method: "DELETE"
                    }
                );

            const data =
                await response.json();

if (!response.ok) {

    if (response.status === 403) {

        broDialog(
            data.error
        );

    } else {

        broDialog(
            "Unable to delete post."
        );

    }

    return;
}
            postElement.remove();

        } catch (error) {

            console.error(
                "Unable to delete post:",
                error
            );

        }

    }
);
actions.appendChild(
    deleteButton
);

// ========================================================
// COMMENT BUTTON
// ========================================================

const commentButton =
    document.createElement("button");

commentButton.className =
    "post-action comment-button";

commentButton.type =
    "button";

commentButton.textContent =
    "💬 0";


// ========================================================
// COMMENT PANEL
// ========================================================

const commentPanel =
    document.createElement("div");

commentPanel.className =
    "comment-panel";

commentPanel.style.display =
    "none";


// COMMENTS LIST

const commentsList =
    document.createElement("div");

commentsList.className =
    "comments-list";

commentPanel.appendChild(
    commentsList
);


// COMMENT INPUT

const commentInputBox =
    document.createElement("div");

commentInputBox.className =
    "comment-input-box";


const commentInput =
    document.createElement("input");

commentInput.type =
    "text";

commentInput.placeholder =
    "Write a comment...";


const commentSendButton =
    document.createElement("button");

commentSendButton.type =
    "button";

commentSendButton.textContent =
    "Send";


commentInputBox.appendChild(
    commentInput
);

commentInputBox.appendChild(
    commentSendButton
);

commentPanel.appendChild(
    commentInputBox
);

postElement.appendChild(
    commentPanel
);


// ========================================================
// LOAD COMMENTS
// ========================================================

async function loadComments() {

    try {

        const response =
            await fetch(
                "/api/broternet/posts/" +
                post.id +
                "/comments"
            );

        const data =
            await response.json();

        if (!response.ok) {

            console.error(
                "Comments failed:",
                data
            );

            return;

        }

        commentButton.textContent =
            "💬 " + data.count;

        commentsList.innerHTML =
            "";

        data.comments.forEach(
            comment => {

                const commentElement =
                    document.createElement(
                        "div"
                    );

                commentElement.className =
                    "comment";


                const commentInfo =
                    document.createElement(
                        "small"
                    );

                commentInfo.textContent =
                    "User " +
                    comment.user_id +
                    " • " +
                    comment.date;


                const commentContent =
                    document.createElement(
                        "p"
                    );

                commentContent.textContent =
                    comment.content;


                commentElement.appendChild(
                    commentInfo
                );

                commentElement.appendChild(
                    commentContent
                );

                commentsList.appendChild(
                    commentElement
                );

            }
        );

    } catch (error) {

        console.error(
            "Unable to load comments:",
            error
        );

    }

}

await loadComments();

// ========================================================
// OPEN / CLOSE COMMENTS
// ========================================================

commentButton.addEventListener(
    "click",
    async () => {

        if (
            commentPanel.style.display ===
            "none"
        ) {

            commentPanel.style.display =
                "block";

            await loadComments();

        } else {

            commentPanel.style.display =
                "none";

        }

    }
);


// ========================================================
// SEND COMMENT
// ========================================================

commentSendButton.addEventListener(
    "click",
    async () => {

        const content =
            commentInput.value.trim();

        if (!content) {
            return;
        }


        try {

            const response =
                await fetch(
                    "/api/broternet/posts/" +
                    post.id +
                    "/comments",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            content: content
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                console.error(
                    "Comment failed:",
                    data
                );

                return;

            }


            commentInput.value =
                "";


            commentButton.textContent =
                "💬 " + data.count;


            await loadComments();

        } catch (error) {

            console.error(
                "Unable to send comment:",
                error
            );

        }

    }
);
actions.appendChild(
    likeButton
);

actions.appendChild(
    commentButton
);


postElement.appendChild(
    actions
);


postsContainer.appendChild(
    postElement
);
        });

    } catch (error) {

        console.error(
            "Unable to load posts:",
            error
        );

        postsContainer.textContent =
            "Unable to load posts.";

    }

}


async function createPost() {

    const titleInput =
        document.getElementById(
            "post-title"
        );

    const contentInput =
        document.getElementById(
            "post-content"
        );


    if (!titleInput || !contentInput) {

        alert(
            "Post form is missing."
        );

        return;

    }


    const title =
        titleInput.value.trim();

    const content =
        contentInput.value.trim();


    if (!title || !content) {

        alert(
            "Title and content are required."
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/broternet/posts",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        title: title,
                        content: content
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                "Unable to create post."
            );

            return;

        }


        titleInput.value = "";
        contentInput.value = "";


        if (postForm) {

            postForm.style.display =
                "none";

        }


        loadPosts();


    } catch (error) {

        console.error(
            "Unable to create post:",
            error
        );

        alert(
            "Unable to connect to Bro Network."
        );

    }

}


// ========================================================
// VIDEO
// ========================================================

const newVideoButton =
    document.getElementById("new-video");

const videoForm =
    document.getElementById("video-form");


if (newVideoButton && videoForm) {

    newVideoButton.addEventListener(
        "click",
        () => {

            videoForm.style.display =
                videoForm.style.display === "none"
                    ? "block"
                    : "none";

        }
    );

}


async function loadVideos() {

    const container =
        document.getElementById("videos");

    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/broternet/videos"
            );

        const videos =
            await response.json();

        container.innerHTML = "";


        if (!videos.length) {

            container.textContent =
                "No videos yet.";

            return;

        }


        videos.forEach(video => {

            const article =
                document.createElement("article");

            article.className =
                "broternet-video";


            const title =
                document.createElement("h3");

            title.textContent =
                video.title;

            article.appendChild(title);


            if (video.type === "embed") {
  if (video.local_source) {

        const player =
            document.createElement("video");

        player.src =
            video.local_source;

        player.controls =
            true;

        player.style.maxWidth =
            "100%";

        article.appendChild(player);

    } else {

        const frame =
            document.createElement("iframe");

        frame.src =
            video.source;

        frame.width =
            "560";

        frame.height =
            "315";

        frame.allowFullscreen =
            true;

        frame.style.maxWidth =
            "100%";

        article.appendChild(frame);
    }

            } else {

                const player =
                    document.createElement("video");

                player.src =
                    video.source;

                player.controls =
                    true;

                player.style.maxWidth =
                    "100%";

                article.appendChild(player);

            }


            const info =
                document.createElement("small");

            info.textContent =
                "ID " +
                video.id +
                " • " +
                video.date;


            article.appendChild(info);

            container.appendChild(article);

        });

    } catch (error) {

        console.error(
            "Unable to load videos:",
            error
        );

        container.textContent =
            "Unable to load videos.";

    }

}


async function createVideo() {

    const titleInput =
        document.getElementById(
            "video-title"
        );

    const typeInput =
        document.getElementById(
            "video-type"
        );

    const sourceInput =
        document.getElementById(
            "video-source"
        );

    const fileInput =
        document.getElementById(
            "video-file"
        );


    if (!titleInput || !typeInput) {

        alert(
            "Video form is missing."
        );

        return;

    }


    const title =
        titleInput.value.trim();

    const type =
        typeInput.value;


    if (!title) {

        alert(
            "Video title is required."
        );

        return;

    }


    let source = "";


    // ============================================
    // EMBED VIDEO
    // ============================================

    if (type === "embed") {

        if (!sourceInput) {

            alert(
                "Video source input is missing."
            );

            return;

        }


        source =
            sourceInput.value.trim();


        if (!source) {

            alert(
                "Enter an embed URL."
            );

            return;

        }

    }


    // ============================================
    // MP4 UPLOAD
    // ============================================

    else if (type === "mp4") {

        if (
            !fileInput ||
            !fileInput.files.length
        ) {

            alert(
                "Choose an MP4 file."
            );

            return;

        }


        const file =
            fileInput.files[0];


        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );


        try {

            const uploadResponse =
                await fetch(
                    "/api/broternet/video/upload",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const uploadData =
                await uploadResponse.json();


            if (!uploadResponse.ok) {

                alert(
                    uploadData.error ||
                    "Video upload failed."
                );

                return;

            }


            source =
                uploadData.url;


        } catch (error) {

            console.error(
                "Video upload failed:",
                error
            );

            alert(
                "Unable to upload video."
            );

            return;

        }

    }


    else {

        alert(
            "Unknown video type."
        );

        return;

    }


    // ============================================
    // PUBLISH VIDEO
    // ============================================

    try {

        const response =
            await fetch(
                "/api/broternet/videos",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        title: title,
                        type: type,
                        source: source
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                "Unable to publish video."
            );

            return;

        }


        titleInput.value = "";


        if (sourceInput) {

            sourceInput.value = "";

        }


        if (fileInput) {

            fileInput.value = "";

        }


        if (videoForm) {

            videoForm.style.display =
                "none";

        }


        loadVideos();


    } catch (error) {

        console.error(
            "Unable to publish video:",
            error
        );

        alert(
            "Unable to publish video."
        );

    }

}


// ========================================================
// MUSIC
// ========================================================

const newMusicButton =
    document.getElementById("new-music");

const musicForm =
    document.getElementById("music-form");


if (newMusicButton && musicForm) {

    newMusicButton.addEventListener(
        "click",
        () => {

            musicForm.style.display =
                musicForm.style.display === "none"
                    ? "block"
                    : "none";

        }
    );

}


async function loadMusic() {

    const container =
        document.getElementById("music");

    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/broternet/music"
            );

        const musicList =
            await response.json();

        container.innerHTML = "";


        if (!musicList.length) {

            container.textContent =
                "No music yet.";

            return;

        }


        musicList.forEach(music => {

            const article =
                document.createElement("article");

            article.className =
                "broternet-music";


            const title =
                document.createElement("h3");

            title.textContent =
                music.title;


            const artist =
                document.createElement("p");

            artist.textContent =
                music.artist ||
                "Unknown artist";


            const player =
                document.createElement("audio");

            player.src =
                music.source;

            player.controls =
                true;


            const info =
                document.createElement("small");

            info.textContent =
                "ID " +
                music.id +
                " • " +
                music.date;


            article.appendChild(title);
            article.appendChild(artist);
            article.appendChild(player);
            article.appendChild(info);

            container.appendChild(article);

        });

    } catch (error) {

        console.error(
            "Unable to load music:",
            error
        );

        container.textContent =
            "Unable to load music.";

    }

}


async function createMusic() {

    const titleInput =
        document.getElementById(
            "music-title"
        );

    const artistInput =
        document.getElementById(
            "music-artist"
        );

    const fileInput =
        document.getElementById(
            "music-file"
        );


    if (
        !titleInput ||
        !artistInput ||
        !fileInput
    ) {

        alert(
            "Music form is missing."
        );

        return;

    }


    const title =
        titleInput.value.trim();

    const artist =
        artistInput.value.trim();


    if (!title) {

        alert(
            "Music title is required."
        );

        return;

    }


    if (!fileInput.files.length) {

        alert(
            "Choose an MP3 file."
        );

        return;

    }


    const file =
        fileInput.files[0];


    // ============================================
    // UPLOAD MP3
    // ============================================

    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );


    let source = "";


    try {

        const uploadResponse =
            await fetch(
                "/api/broternet/music/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


        const uploadData =
            await uploadResponse.json();


        if (!uploadResponse.ok) {

            alert(
                uploadData.error ||
                "Music upload failed."
            );

            return;

        }


        source =
            uploadData.url;


    } catch (error) {

        console.error(
            "Music upload failed:",
            error
        );

        alert(
            "Unable to upload music."
        );

        return;

    }


    // ============================================
    // PUBLISH MUSIC
    // ============================================

    try {

        const response =
            await fetch(
                "/api/broternet/music",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        title: title,
                        artist: artist,
                        source: source
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                "Unable to publish music."
            );

            return;

        }


        titleInput.value = "";
        artistInput.value = "";
        fileInput.value = "";


        if (musicForm) {

            musicForm.style.display =
                "none";

        }


        loadMusic();


    } catch (error) {

        console.error(
            "Unable to publish music:",
            error
        );

        alert(
            "Unable to publish music."
        );

    }

}


// ========================================================
// VIDEO TYPE SWITCHER
// ========================================================

const videoType =
    document.getElementById(
        "video-type"
    );

const embedContainer =
    document.getElementById(
        "embed-container"
    );

const uploadContainer =
    document.getElementById(
        "video-upload-container"
    );


function updateVideoForm() {

    if (
        videoType.value === "embed"
    ) {

        embedContainer.style.display =
            "block";

        uploadContainer.style.display =
            "none";

    } else {

        embedContainer.style.display =
            "none";

        uploadContainer.style.display =
            "block";

    }

}


videoType.addEventListener(
    "change",
    updateVideoForm
);

// ========================================================
// IMAGE POSTS
// ========================================================

const newImageButton =
    document.getElementById(
        "new-image"
    );

const imageForm =
    document.getElementById(
        "image-form"
    );


// --------------------------------------------------------
// SHOW / HIDE IMAGE FORM
// --------------------------------------------------------

if (newImageButton && imageForm) {

    newImageButton.addEventListener(
        "click",
        () => {

            imageForm.style.display =
                imageForm.style.display === "none"
                    ? "block"
                    : "none";

        }
    );

}


// --------------------------------------------------------
// LOAD IMAGE POSTS
// --------------------------------------------------------

async function loadImages() {

    const container =
        document.getElementById(
            "images"
        );


    if (!container) {

        return;

    }


    try {

        const response =
            await fetch(
                "/api/broternet/images"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load images"
            );

        }


        const images =
            await response.json();


        container.innerHTML = "";


        if (!images.length) {

            container.textContent =
                "No image posts yet.";

            return;

        }


        images.forEach(image => {

            const article =
                document.createElement(
                    "article"
                );

            article.className =
                "broternet-image";


            // --------------------------------------------
            // TITLE
            // --------------------------------------------

            const title =
                document.createElement(
                    "h3"
                );

            title.textContent =
                image.title;


            // --------------------------------------------
            // DESCRIPTION
            // --------------------------------------------

            const content =
                document.createElement(
                    "p"
                );

            content.textContent =
                image.content || "";


            // --------------------------------------------
            // IMAGE
            // --------------------------------------------

            const picture =
                document.createElement(
                    "img"
                );

            picture.src =
                image.source;

            picture.alt =
                image.title;

            picture.style.maxWidth =
                "100%";

            picture.loading =
                "lazy";


            // --------------------------------------------
            // INFO
            // --------------------------------------------

            const info =
                document.createElement(
                    "small"
                );

            info.textContent =
                "ID " +
                image.id +
                " • " +
                image.date;


            // --------------------------------------------
            // APPEND
            // --------------------------------------------

            article.appendChild(
                title
            );


            if (image.content) {

                article.appendChild(
                    content
                );

            }


            article.appendChild(
                picture
            );


            article.appendChild(
                info
            );


            container.appendChild(
                article
            );

        });

    } catch (error) {

        console.error(
            "Unable to load image posts:",
            error
        );


        container.textContent =
            "Unable to load images.";

    }

}


// --------------------------------------------------------
// CREATE IMAGE POST
// --------------------------------------------------------

async function createImagePost() {

    const titleInput =
        document.getElementById(
            "image-title"
        );


    const contentInput =
        document.getElementById(
            "image-content"
        );


    const fileInput =
        document.getElementById(
            "image-file"
        );


    if (
        !titleInput ||
        !contentInput ||
        !fileInput
    ) {

        console.error(
            "Image form elements not found"
        );

        return;

    }


    const title =
        titleInput.value.trim();


    const content =
        contentInput.value.trim();


    // --------------------------------------------
    // VALIDATE TITLE
    // --------------------------------------------

    if (!title) {

        alert(
            "Image title is required."
        );

        return;

    }


    // --------------------------------------------
    // VALIDATE FILE
    // --------------------------------------------

    if (!fileInput.files.length) {

        alert(
            "Select an image first."
        );

        return;

    }


    const formData =
        new FormData();


    formData.append(
        "file",
        fileInput.files[0]
    );


    try {

        // ========================================
        // UPLOAD IMAGE FILE
        // ========================================

        const uploadResponse =
            await fetch(
                "/api/broternet/images/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


        const uploadData =
            await uploadResponse.json();


        if (!uploadResponse.ok) {

            alert(
                uploadData.error ||
                "Unable to upload image."
            );

            return;

        }


        // ========================================
        // CREATE IMAGE POST
        // ========================================

        const postResponse =
            await fetch(
                "/api/broternet/images",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        title: title,

                        content: content,

                        source:
                            uploadData.url

                    })
                }
            );


        const postData =
            await postResponse.json();


        if (!postResponse.ok) {

            alert(
                postData.error ||
                "Unable to publish image."
            );

            return;

        }


        // ========================================
        // CLEAR FORM
        // ========================================

        titleInput.value = "";

        contentInput.value = "";

        fileInput.value = "";


        imageForm.style.display =
            "none";


        // ========================================
        // RELOAD POSTS
        // ========================================

        await loadImages();


        console.log(
            "Image post published:",
            postData
        );

    } catch (error) {

        console.error(
            "Unable to create image post:",
            error
        );


        alert(
            "Unable to connect to Bro Network."
        );

    }

}
// ========================================================
// INITIAL LOAD
// ========================================================

loadPosts();

loadVideos();

loadMusic();

updateVideoForm();

loadImages();

