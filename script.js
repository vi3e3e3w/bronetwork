/* =========================
   BRO NETWORK
   MAIN SCRIPT
========================= */


/* =========================
   BRO DIALOG
========================= */

function broDialog(
    content,
    opt1 = "OK",
    opt2 = "Cancel"
) {

    const dialog =
        document.getElementById(
            "bro-dialog"
        );

    const text =
        document.getElementById(
            "bro-dialog-content"
        );

    const button1 =
        document.getElementById(
            "bro-dialog-opt1"
        );

    const button2 =
        document.getElementById(
            "bro-dialog-opt2"
        );


    if (
        !dialog ||
        !text ||
        !button1 ||
        !button2
    ) {

        console.warn(
            "BroDialog elements not found."
        );

        return;

    }


    text.textContent =
        content;


    button1.textContent =
        opt1;


    button2.textContent =
        opt2;


    dialog.classList.add(
        "show"
    );


    button1.onclick =
        () => {

            dialog.classList.remove(
                "show"
            );

        };


    button2.onclick =
        () => {

            dialog.classList.remove(
                "show"
            );

        };

}


/* =========================
   BRO PROMPT
========================= */

function BroPrompt(
    content,
    placeholder = ""
) {

    return new Promise(
        (resolve) => {

            const dialog =
                document.getElementById(
                    "bro-prompt"
                );

            const text =
                document.getElementById(
                    "bro-prompt-content"
                );

            const input =
                document.getElementById(
                    "bro-prompt-input"
                );

            const ok =
                document.getElementById(
                    "bro-prompt-ok"
                );

            const cancel =
                document.getElementById(
                    "bro-prompt-cancel"
                );


            if (
                !dialog ||
                !text ||
                !input ||
                !ok ||
                !cancel
            ) {

                console.warn(
                    "BroPrompt elements not found."
                );

                resolve(null);

                return;

            }


            text.textContent =
                content;


            input.value =
                "";


            input.placeholder =
                placeholder;


            dialog.classList.add(
                "show"
            );


            setTimeout(
                () => {

                    input.focus();

                },
                450
            );


            function close(
                value
            ) {

                dialog.classList.remove(
                    "show"
                );

                resolve(value);

            }


            ok.onclick =
                () => {

                    close(
                        input.value
                    );

                };


            cancel.onclick =
                () => {

                    close(null);

                };


            input.onkeydown =
                (event) => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        close(
                            input.value
                        );

                    }


                    if (
                        event.key ===
                        "Escape"
                    ) {

                        close(null);

                    }

                };

        }
    );

}


/* =========================
   SIGNUP
========================= */

async function signup() {

    try {

        const response =
            await fetch(
                "/register",
                {
                    method:
                        "POST"
                }
            );


        const data =
            await response.json();


        broDialog(
            data.message +
            "\n\nYour Bro Network ID: " +
            data.id +
            " 🗿📡"
        );

    } catch (error) {

        console.error(
            error
        );


        broDialog(
            "Registration failed! 😭"
        );

    }

}


/* =========================
   LOGIN
========================= */

async function login() {

    const password =
        await BroPrompt(
            "Enter admin password:",
            "pass"
        );


    if (
        password === null
    ) {

        return;

    }


    broDialog(
        "Nice try. 😭\n\n" +
        "The admin page is not available yet.",
        "OK",
        "Close"
    );

}


/* =========================
   GET OUT
========================= */

function getout() {

    broDialog(
        "Bro, if you want to exit and never meet this network:\n\n" +
        "1. Exit this page\n" +
        "2. Disconnect this network\n" +
        "3. Forget this network\n" +
        "4. Pretend to be 'Wtf is this network'\n\n" +
        "That's all! 🗿"
    );

}


/* =========================
   SEND MESSAGE
========================= */

function sendMessage() {

    const input =
        document.getElementById(
            "message"
        );


    if (!input) {

        return;

    }


    const text =
        input.value.trim();


    if (
        text === ""
    ) {

        return;

    }


    const messages =
        document.querySelector(
            ".messages"
        );


    if (!messages) {

        console.warn(
            "Message container not found."
        );

        return;

    }


    const message =
        document.createElement(
            "div"
        );


    message.className =
        "message";


    const name =
        document.createElement(
            "b"
        );


    name.textContent =
        "(10) ";


    const content =
        document.createTextNode(
            text
        );


    message.appendChild(
        name
    );


    message.appendChild(
        content
    );


    messages.appendChild(
        message
    );


    input.value =
        "";


    messages.scrollTop =
        messages.scrollHeight;

}


/* =========================
   ACTIVE USERS
========================= */

async function updateActiveUsers() {

    try {

        const response =
            await fetch(
                "/api/status"
            );


        if (
            !response.ok
        ) {

            return;

        }


        const data =
            await response.json();


        const counters =
            document.querySelectorAll(
                ".active-user-count"
            );


        counters.forEach(
            (counter) => {

                counter.textContent =
                    data.active_users;

            }
        );


        const registeredCounters =
            document.querySelectorAll(
                ".registered-user-count"
            );


        registeredCounters.forEach(
            (counter) => {

                counter.textContent =
                    data.registered_users;

            }
        );

    } catch (error) {

        console.log(
            "Unable to get network status"
        );

    }

}


updateActiveUsers();


setInterval(
    updateActiveUsers,
    10000
);


/* =========================
   CONSOLE
========================= */

console.log(
    "%cBRO NETWORK ONLINE",
    "font-size: 20px; font-weight: bold;"
);


console.log(
    "Local Network • No Internet Required"
);


console.log(
    "hello you in Google Chrome console"
);


/* =========================
   NOTIFICATIONS
========================= */

async function enableNotifications() {

    if (
        !(
            "Notification" in window
        )
    ) {

        console.log(
            "Browser notifications are not supported."
        );

        return;

    }


    if (
        Notification.permission ===
        "default"
    ) {

        try {

            const permission =
                await Notification.requestPermission();


            console.log(
                "Notification permission:",
                permission
            );

        } catch (error) {

            console.error(
                error
            );

        }

    }

}


enableNotifications();


function showBroNotification(
    title,
    message
) {

    if (
        !(
            "Notification" in window
        )
    ) {

        return;

    }


    if (
        Notification.permission ===
        "granted"
    ) {

        new Notification(
            title,
            {

                body:
                    message,

                icon:
                    "logo.svg"

            }
        );

    }

}


/* =========================
   CHECK NOTIFICATIONS
========================= */

async function checkNotifications() {

    try {

        const response =
            await fetch(
                "/api/notifications"
            );


        if (
            !response.ok
        ) {

            return;

        }


        const notifications =
            await response.json();


        if (
            !Array.isArray(
                notifications
            )
        ) {

            return;

        }


        notifications.forEach(
            (notification) => {

                console.log(
                    "PING:",
                    notification
                );


                showBroNotification(
                    "Bro Network Ping",
                    "ID " +
                    notification.from +
                    " pinged you:\n" +
                    notification.message
                );

            }
        );

    } catch (error) {

        console.error(
            "Unable to check notifications:",
            error
        );

    }

}


checkNotifications();


setInterval(
    checkNotifications,
    2000
);


/* =========================
   VECTOR FIELD
   STATIC DOT GRID
   NO ATTRACTION
========================= */

const field =
    document.getElementById(
        "vector-field"
    );


if (field) {


    const canvas =
        document.createElement(
            "canvas"
        );


    field.appendChild(
        canvas
    );


    const ctx =
        canvas.getContext(
            "2d"
        );


    let width =
        0;


    let height =
        0;


    const mouse = {

        x:
            -1000,

        y:
            -1000

    };


    const particles =
        [];


    const GAP =
        42;


    const RADIUS =
        220;


    /* =========================
       CREATE GRID
    ========================= */

    function createParticles() {

        particles.length =
            0;


        for (
            let y = GAP / 2;
            y < height;
            y += GAP
        ) {

            for (
                let x = GAP / 2;
                x < width;
                x += GAP
            ) {

                particles.push({

                    x:
                        x,

                    y:
                        y,

                    size:
                        1.5

                });

            }

        }

    }


    /* =========================
       RESIZE
    ========================= */

    function resizeCanvas() {

        const rect =
            field.getBoundingClientRect();


        width =
            rect.width;


        height =
            rect.height;


        canvas.width =
            width;


        canvas.height =
            height;


        createParticles();

    }


    window.addEventListener(
        "resize",
        resizeCanvas
    );


    resizeCanvas();


    /* =========================
       MOUSE
    ========================= */

    window.addEventListener(
        "mousemove",
        (event) => {

            const rect =
                field.getBoundingClientRect();


            mouse.x =
                event.clientX -
                rect.left;


            mouse.y =
                event.clientY -
                rect.top;

        }
    );


    window.addEventListener(
        "mouseout",
        (event) => {

            if (
                !field.contains(
                    event.relatedTarget
                )
            ) {

                mouse.x =
                    -1000;


                mouse.y =
                    -1000;

            }

        }
    );


    /* =========================
       ANIMATION
    ========================= */

    function animate() {


        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        for (
            const particle
            of particles
        ) {


            const dx =
                mouse.x -
                particle.x;


            const dy =
                mouse.y -
                particle.y;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            let strength =
                0;


            if (
                distance <
                RADIUS
            ) {

                strength =
                    1 -
                    (
                        distance /
                        RADIUS
                    );

            }


            /*
            NORMAL DOT

            Gray with a slight
            Bro Network tint
            */

            const normal = {

                r:
                    70,

                g:
                    82,

                b:
                    78

            };


            /*
            BRO NETWORK GREEN

            #67e8a6
            */

            const accent = {

                r:
                    103,

                g:
                    232,

                b:
                    166

            };


            /*
            COLOR INTERPOLATION
            */


            const red =
                Math.round(

                    normal.r +

                    (
                        accent.r -
                        normal.r
                    ) *

                    strength

                );


            const green =
                Math.round(

                    normal.g +

                    (
                        accent.g -
                        normal.g
                    ) *

                    strength

                );


            const blue =
                Math.round(

                    normal.b +

                    (
                        accent.b -
                        normal.b
                    ) *

                    strength

                );


            /*
            SIZE

            Near mouse =
            slightly brighter
            */

            const size =

                particle.size +

                strength *
                1.2;


            /*
            DRAW MAIN DOT
            */

            ctx.beginPath();


            ctx.arc(

                particle.x,

                particle.y,

                size,

                0,

                Math.PI * 2

            );


            ctx.fillStyle =

                `rgb(
                    ${red},
                    ${green},
                    ${blue}
                )`;


            ctx.fill();


            /*
            GLOW

            Like a flashlight.

            DOES NOT MOVE
            OR ATTRACT DOTS.
            */

            if (
                strength >
                0.05
            ) {

                ctx.beginPath();


                ctx.arc(

                    particle.x,

                    particle.y,

                    size +

                    strength *
                    5,

                    0,

                    Math.PI * 2

                );


                ctx.fillStyle =

                    `rgba(
                        103,
                        232,
                        166,
                        ${strength * 0.10}
                    )`;


                ctx.fill();

            }

        }


        requestAnimationFrame(
            animate
        );

    }


    animate();

}
