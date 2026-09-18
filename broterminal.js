const terminalOutput =
    document.querySelector(
        ".terminal-output"
    );

let USER_ID = null;
function printLine(text = "") {

const line =
    document.createElement("div");

line.className =
    "terminal-line";

line.textContent = text;

terminalOutput.appendChild(line);

}

function printCommand(command) {

const line =
    document.createElement("div");

line.className =
    "terminal-line";

const prompt =
    document.createElement("span");

prompt.className =
    "terminal-prompt";

prompt.textContent =
    USER_ID +
    "@broterminal:~$ ";


const commandText =
    document.createElement("span");

commandText.textContent =
    command;


line.appendChild(prompt);
line.appendChild(commandText);

terminalOutput.appendChild(line);

}

async function runCommand(command, input) {

    command = command.trim();

    if (!command) {
        return;
    }

    printCommand(command);

    input.value = "";

try {

    const response =
        await fetch(
            "/api/terminal",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    command: command
                })
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        printLine(
            "gash: " +
            (data.err ||
            "Unknown error")
        );

        return;
    }


    if (data.clear) {

        terminalOutput.innerHTML =
            "";

        return;
    }


    if (data.output) {

        const lines =
            data.output.split("\n");


        for (const line of lines) {

            printLine(line);

        }

    }

} catch (error) {

    printLine(
        "gash: unable to connect to Flask"
    );

    console.error(
        "BroTerminal:",
        error
    );

}


terminalOutput.scrollTop =
    terminalOutput.scrollHeight;

}
function createPrompt() {

    const row =
        document.querySelector(
            ".terminal-input-row"
        );

    const prompt =
        document.createElement("span");

    prompt.className =
        "terminal-prompt";

    prompt.textContent =
        USER_ID +
        "@broterminal:~$";


    const input =
        document.createElement("input");

    input.type = "text";
    input.id = "terminal-input";
    input.autocomplete = "off";
    input.spellcheck = false;


    row.appendChild(prompt);
    row.appendChild(input);


    return input;
}
async function loadUserID() {

    const response =
        await fetch("/api/me");

    const data =
        await response.json();

    USER_ID = data.id;

    const terminalInput =
        createPrompt();

    terminalInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key !== "Enter") {
                return;
            }

            runCommand(
                terminalInput.value,
                terminalInput
            );

        }
    );

    terminalInput.focus();
}


loadUserID();
