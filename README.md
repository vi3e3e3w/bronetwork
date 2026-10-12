# BroNetwork

**BroNetwork** is a collection of local-network services and experiments.

## Broternet

**Broternet** is a media service built on BroNetwork.

It is designed for devices connected to the same local network, allowing users to share and access:

* 📝 Posts
* 🎬 Videos
* 🎵 Music
* 🖼️ Images

### Features

* Local-network media sharing
* No Internet connection required
* Simple web interface
* Posts and media management
* Video, music, and image support

### Running locally

Clone the repository and start the server:

```bash
git clone <repository-url>
cd bronetwork
python3 server.py
```

or

```bash
wget "https://github.com/vi3e3e3w/bronetwork/releases/download/Release/install-bronetwork.sh"
chmod +x install-bronetwork.sh
```
if you don't care about IT/Linux

Then open:

```text
http://127.0.0.1:8080/
```

or access the server from another device on the same LAN using the host's local IP address.

## Project status

BroNetwork is currently under development.

Some features may be incomplete or experimental.

## License

BroNetwork is free software licensed under the **GNU General Public License v3.0 or later**.

See [`LICENSE`](LICENSE) for the full license text.

## ⚠️ Privacy and Security Warning

We respect your privacy. However, once personal information or files have been committed and pushed to a public repository, we cannot guarantee their removal from Git history, forks, clones, or other copies. You are responsible for reviewing your commits before pushing them.

Broternet's local web environment is not completely secure. If you are a developer, please consider contributing a pull request to improve the project's ".gitignore" and help prevent personal or sensitive files from being committed accidentally.

For parents and guardians: You can clone this project to give children a simulated Internet experience within a local network, without exposing them directly to strangers on the public Internet. However, a local network is not automatically safe. Please review the content, configure the environment carefully, and supervise its use.

Remember: ".gitignore" helps prevent untracked files from being added to Git, but it does not automatically remove files that are already tracked or erase previously pushed content.



