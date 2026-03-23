# lms-plugin-computer

Give your local model its own Linux CLI computer. It gets a real isolated container it can run shell commands in, write and read files, install packages, and manage processes - all without touching your host system.

---

## Before you start

You'll need a container runtime. Install one based on your OS and make sure it's running before using the plugin.

**Windows & macOS** - [Docker Desktop](https://docs.docker.com/desktop/) is the easiest option. Just install it and keep it open in the background.

**Linux** - [Podman](https://podman.io/getting-started/installation) works great and doesn't require root. After installing, run these once:

```bash
# Ubuntu/Debian
sudo apt install uidmap slirp4netns
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 $USER
```

Then log out and back in. The plugin takes care of everything else automatically.

---

## Installation

The easiest way:
```bash
lms install khtsly/computer
```

Or from source if you want to build it yourself:
```bash
git clone https://github.com/khtsly/lms-plugin-computer
cd lms-plugin-computer
# with bun
bun run dev
# with node
npm run dev
```

---

## Getting started

1. Open LM Studio and start a new chat with any tool-capable model
2. Enable the **khtsly/computer** plugin from the plugin panel
3. Say something like *"do you have a computer?"* or just give it a task

On first use it will pull the Ubuntu image and set up the container - this takes a bit while for the first time.

---

## Settings

Click the gear icon next to the plugin to open settings.

### The basics

**Internet Access** - `off` by **default**. Turn this *on* if you want the model to install packages with `apt-get`, `pip`, `npm`, etc. If you change this after the container is already running, just tell the model *"rebuild the computer"* and it will recreate it with the new setting.

**Persistence Mode** - persistent by default, meaning files and installed packages survive across sessions. Switch to ephemeral if you want a clean slate every time LM Studio opens.

**Base Image** - Ubuntu 24.04 is recommended. Alpine is available if you want something ultra-lightweight, though some packages behave differently with its musl libc.

### Resource limits

| Setting | Default | Range |
|---------|---------|-------|
| CPU cores | 2 | 0–8 (0 = unlimited) |
| Memory | 1024 MB | 256–8192 MB |
| Disk | 4096 MB | 512–32768 MB |

### Other options

**Auto-Install Packages** - choose what gets pre-installed when the container is first created. Options range from nothing to a full set including Python, Node.js, build tools, and networking utilities.

**Shared Folder** - mount a folder from your computer into the container at `/mnt/shared`. Useful for giving the model access to your files without going through the upload tool every time.

**Port Forwards** - expose ports from the container to your host. For example `8080:80` lets you open `localhost:8080` in your browser to see whatever the model is running inside.

**Command Timeout** - how long a single command can run before it gets killed. Default is 30 seconds. Bump this up if you're doing long installs or builds.

---

## What the model can do?

The model has access to these tools automatically - you don't need to ask it to use them, it figures out what's needed on its own.

- **Execute** - run shell commands
- **WriteFile / ReadFile** - create and read files inside the container
- **ListDirectory** - browse the filesystem
- **UploadFile / DownloadFile** - move files between the container and your computer
- **ComputerStatus** - check system info, resource usage, running processes
- **RebuildComputer** - tear down and recreate the container from scratch

---

## Examples

**Run some code**
> "Write a Python script that generates a Fibonacci sequence up to 1000 and save it as fib.py"

**Set up an environment**
> "Set up a Node.js project with Express, create a basic REST API, and start the server"

**Work with your files**
> Attach a CSV file and say: "Analyse this data and give me a summary with the key trends"

**Run a web server you can actually open**
> Set Port Forwards to `8080:8080` in settings, then say: "Build a simple dashboard and serve it on port 8080"

---

## Troubleshooting

**"No container found" error on startup**
Your runtime isn't running. On Windows and Mac, make sure Docker Desktop is open. On Linux, check that `docker` or `podman` is installed and accessible.

**Internet doesn't work inside the container**
First check that Internet Access is set to On in settings. If it was already running before you toggled it, the container needs to be recreated - just tell the model:
> "Rebuild the computer"

It will destroy the old container and create a new one with internet enabled.

**Container keeps failing on Linux**
Make sure you ran the setup commands in the requirements section. Then clear the old container and let it recreate:
```bash
podman rm -f lms-computer-main
```

**Commands are timing out**
Increase Command Timeout in settings. The default 30 seconds isn't always enough for large package installs or slow builds.

**Files disappeared after reopening LM Studio**
Check that Persistence Mode is set to Persistent. If it was set to Ephemeral, the container was wiped on close - that's expected behaviour.

---

## A few things worth knowing

The container is fully isolated - it can't access anything on your host unless you set up a shared folder or port forward. Your files are safe.

The disk limit is only hard-enforced on XFS filesystems. On ext4 (most Linux installs), usage is tracked and reported correctly but the limit isn't enforced at the OS level.

Changing the base image only takes effect on a fresh container. If you switch from Ubuntu to Alpine, tell the model to rebuild.

---

## License

MIT