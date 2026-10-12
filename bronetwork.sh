#!/usr/bin/env bash
set -e

PROJECT_DIR="$HOME/bronetwork"
VENV_DIR="$PROJECT_DIR/.venv"
REPO_URL="https://github.com/vi3e3e3w/bronetwork"

echo "Checking BroNetwork project..."

if [[ ! -d "$PROJECT_DIR/.git" ]]; then
    if [[ -e "$PROJECT_DIR" ]]; then
        echo "Error: $PROJECT_DIR exists but is not a Git repository."
        exit 1
    fi

    echo "Project not found; cloning..."
    git clone "$REPO_URL" "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

echo "Checking virtual environment..."

if [[ ! -f "$VENV_DIR/bin/activate" ]]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

if [[ ! -f "$PROJECT_DIR/requirements.txt" ]]; then
    echo "Error: requirements.txt not found."
    exit 1
fi

echo "Checking dependencies..."
python -m pip install -r "$PROJECT_DIR/requirements.txt"

if ! command -v waitress-serve >/dev/null 2>&1; then
    echo "Error: waitress-serve is not installed in the virtual environment."
    exit 1
fi

echo "Starting BroNetwork with Waitress..."
exec "$VENV_DIR/bin/waitress-serve" \
    --host=0.0.0.0 \
    --port=8080 \
    --ident="BroNetwork" \
    --threads=14 \
    server:app

