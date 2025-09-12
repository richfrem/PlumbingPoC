# **How to Generate a Reusable Database Schema (`schema.sql`)**

This document outlines the definitive process for generating a `schema.sql` file from a remote Supabase project. This file is a complete, data-free blueprint of your database, including all tables, columns, Row Level Security (RLS) policies, and functions. It's a critical asset for setting up new client instances or restoring a database structure.

#### **1. Prerequisites**

Before you begin, ensure your local development environment is set up correctly. This is a one-time setup.

1.  **Homebrew Installed:** Make sure you have Homebrew, the package manager for macOS. If not, you can install it from [brew.sh](https://brew.sh/).

2.  **Supabase CLI Installed & Updated:** You need the Supabase Command Line Interface.
    *   **Install:** `brew install supabase`
    *   **Verify Version:** Run `supabase --version`. Ensure you are on version `2.40.7` or newer to match the commands in this guide.
    *   **Update if needed:** `brew upgrade supabase`

3.  **Docker Desktop Installed & Running:** The Supabase CLI uses Docker in the background to ensure version consistency.
    *   **Install:** Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/).
    *   **CRITICAL:** Before running any Supabase commands, **make sure Docker Desktop is running**. You should see the whale icon in your macOS menu bar, and it should be stationary (not animating).

#### **2. The Process (To be run for each project)**

Follow these steps from your terminal.

**Step 1: Navigate to Your Project Directory**
```bash
# Example path, adjust to your own
cd ~/Projects/PlumbingPoC
```

**Step 2: Log in to the Supabase CLI**
This will open a browser window for you to authorize the CLI.
```bash
supabase login
```

**Step 3: Link Your Local Project to the Remote Supabase Project**
This command will prompt you to choose which remote project you want to work with. It will also ask for your database password.
```bash
supabase link
```

**Step 4: Pull Remote Configuration (Best Practice)**
This syncs your local `supabase/config.toml` file with the latest settings from your Supabase dashboard (like auth providers, redirect URLs, etc.).
```bash
supabase config pull
```

**Step 5: Dump the Database Schema**
This is the final command. It connects to your linked project and saves the schema blueprint to a file.
```bash
# This command dumps the schema ONLY (no data) by default.
# The output is saved to a file named 'schema.sql' inside your 'supabase' directory.
supabase db dump -f supabase/schema.sql
```

#### **3. Verification**

After the command completes, you should have a new file at `supabase/schema.sql`. Open this file to verify its contents:
*   You **SHOULD** see SQL commands like `CREATE TABLE ...`, `CREATE POLICY ...`, and `ALTER TABLE ...`.
*   You **SHOULD NOT** see any commands like `INSERT INTO ...` or `COPY ...` that contain actual user or request data.

You have now successfully created a reusable schema file. You can commit this file to your Git repository so the entire team has a version-controlled copy of the database structure.