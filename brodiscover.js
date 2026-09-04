async function loadDevices() {

    const deviceList =
        document.querySelector("#device-list");


    try {

        const response =
            await fetch(
                "/api/network/devices"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load devices"
            );

        }


        const devices =
            await response.json();


        deviceList.innerHTML = "";


        devices.forEach(device => {


            // Hide IPv6 for now

            if (
                !device.ip.includes(".")
            ) {

                return;

            }


            const id =
                device.ip
                    .split(".")
                    .pop();


            const row =
                document.createElement("div");


            row.className =
                "discover-row";


            const stateClass =

                device.state === "REACHABLE"

                    ? "device-reachable"

                    : "device-stale";


            row.innerHTML = `

                <div>
                    ${id}
                </div>

                <div>
                    ${device.ip}
                </div>

                <div>
                    ${device.interface}
                </div>

                <div>
                    ${device.mac}
                </div>

                <div
                    class="${stateClass}"
                >
                    ${device.state}
                </div>

            `;


            deviceList.appendChild(
                row
            );

        });


    } catch (error) {

        console.error(
            "BroDiscover error:",
            error
        );


        deviceList.innerHTML = `

            <div class="discover-row">

                <div>
                    !
                </div>

                <div>
                    Unable to scan
                </div>

                <div>
                    -
                </div>

                <div>
                    -
                </div>

                <div>
                    ERROR
                </div>

            </div>

        `;

    }

}


loadDevices();


setInterval(
    loadDevices,
    5000
);
