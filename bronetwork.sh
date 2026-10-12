#!/usr/bin/env bash
set -e

PROJECT_DIR="$HOME/bronetwork"
VENV_DIR="$PROJECT_DIR/.venv"
REPO_URL="https://github.com/vi3e3e3w/bronetwork"

echo "Checking Bro Network's up-to-date..."

if ! git pull;then 
    echo "Failed to update"
    exit 1

cd "$PROJECT_DIR"

echo "Updating BroNetwork executable if possible..."

if install -m 755 \
    "$HOME/bronetwork/bronetwork.sh" \
    "$HOME/.local/bin/bronetwork"; then
    echo "[OK] Executable installed: ~/.local/bin/bronetwork"
else
    echo "[E] Failed to update executable."
    exit 1
fi
echo "Checking virtual environment..."

if [[ ! -f "$VENV_DIR/bin/activate" ]]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

if [[ ! -f "$PROJECT_DIR/requirements.txt" ]]; then
    echo "Error: requirements.txt not found."
    exit 2
fi

echo "Checking dependencies after up-to-date..."
python -m pip install -r "$PROJECT_DIR/requirements.txt"

if ! command -v waitress-serve >/dev/null 2>&1; then
    echo "Error: waitress-serve is not installed in the virtual environment."
    exit 3

fi

echo "Starting BroNetwork with Waitress..."
exec "$VENV_DIR/bin/waitress-serve" \
    --host=0.0.0.0 \
    --port=8080 \
    --ident="BroNetwork" \
    --threads=14 \
    server:app

