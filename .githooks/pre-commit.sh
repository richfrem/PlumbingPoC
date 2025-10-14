#!/usr/bin/env bash
# DEPRECATED: Replaced with Python version (pre-commit) for better readability
# Pre-commit hook to prevent leaking secrets.
# Rules:
# 1) Block .env files except literal .env.example
# 2) Scan staged files for key assignments; block unless RHS empty or '<REDACTED>'
# 3) Summarize violations

# Bash strict mode: exit on error, treat unset variables as errors, propagate pipeline failures
# -e exit immediately with an non-zero status
# -u treat unset variables as an error
# -o pipefail the return value of a pipeline is the status of the last command to exit with a non-zero status
set -euo pipefail
# Set Internal Field Separator to newline and tab only (safer word splitting)
IFS=$'\n\t'

# Configurable exclusions
EXCLUDED_DIRS=("node_modules")
EXCLUDED_PATTERNS=(".githooks/*" "*.jpg" "*.jpeg" "*.png" "*.gif" "*.bmp" "*.tiff" "*.mp4" "*.avi" "*.mov" "*.webm" "*.mkv" "playwright-report/index.html")

# Keys to scan for in assignments (case-insensitive regex)
KEYS="GEMINI_API_KEY|OPENAI_API_KEY|RESEND_API_KEY|SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|VITE_GOOGLE_MAPS_API_KEY|VITE_SUPABASE_ANON_KEY|API_KEY|SECRET|TOKEN|PASSWORD"
# Whitelisted RHS values that are allowed (e.g., redacted placeholders)
WHITELIST="<REDACTED>|'<REDACTED>'"

# Collect staged files NUL-safe (handles filenames with spaces/newlines)
# define an array to hold full list of staged files by git diff
STAGED=()
# Default internal field separator -- IFS (space, tab, newline) e.g. "hello world" treated as two words
# but in this case with file names, we want to treat the entire filename as a single word so no separator
# no IFS provided so a file name like "my file.txt" is treated as a single word
# read -r = raw mode, also allows backslashes in filenames
# -d '' = read until null byte (NUL), not newline.  d stands for null \0 delimiter?
#       -d delim The first character of delim is used to terminate the input line,  rather than newline.
while IFS= read -r -d '' f
do
    STAGED+=("$f")
done < <(git diff --cached --name-only -z)  
#gets list of staged files, separated by null bytes. names only -z stands for null byte

# If no staged files, exit early (nothing to check)
if [ ${#STAGED[@]} -eq 0 ]; then exit 0; fi

EXIT_CODE=0

# Array to hold violation messages
VIOLATIONS=()

# Loop through each staged file array
for FILE in "${STAGED[@]}"; do
  [ -n "$FILE" ] || continue  # Skip empty filenames

  # Check if file is in excluded directories
  for dir in "${EXCLUDED_DIRS[@]}"; do
    if [[ "$FILE" == $dir/* ]]; then continue 2; fi  # Skip this file
  done

  # Check if file matches excluded patterns
  for pat in "${EXCLUDED_PATTERNS[@]}"; do
    if [[ "$FILE" == $pat ]]; then continue 2; fi  # Skip this file
  done

  # Rule 1: block .env files except .env.example
  if [[ "$FILE" == *.env* && "$FILE" != ".env.example" ]]; then
    VIOLATIONS+=("BLOCKED .env file: $FILE")
    EXIT_CODE=1
    continue
  fi

  # Skip if not a staged blob (deleted/dir/submodule)
  if ! git show :"$FILE" >/dev/null 2>&1; then continue; fi

  # Rule 2: scan staged content for key assignments
  # Read each input line: lineno gets the line number, rest gets the line content (split on ':' from nl command)
  # For each line in the staged file that contains a secret key, extract the assigned 
  #value and check if it's allowed.  
  # Plain language: For each staged file, process lines with secret keys; if RHS value isn't whitelisted, record violation
  while IFS=: read -r lineno rest; do
    line="$rest"
    # Extract RHS of assignment using sed regex
    rhs=$(printf '%s\n' "$line" | sed -nE "s/.*($KEYS)\s*[:=]\s*['\"]?([^'\"\s]*)['\"]?.*/\2/p")
    [ -z "$rhs" ] && continue  # No assignment found
    if [[ "$WHITELIST" == *"$rhs"* ]]; then continue; fi  # Whitelisted value
    VIOLATIONS+=("VIOLATION: $FILE:$lineno -> $line")
    EXIT_CODE=1
  # Process substitution: feed the output of the pipeline (numbered lines containing key matches) 
  # into the while loop's stdin, where 'read -r lineno rest' splits each line on ':' into lineno and rest variables
  # < <(pipeline): process substitution - executes the pipeline in a subshell and redirects its stdout as input to the while loop
  # nl = numbered lines -ba = number all lines (including blank) 
  # -w1 = width 1 (min digits) 
  # -s: = separate number and line with colon
  # grep -Eni = grep with -E extended regex, -n show line numbers 
  done < <(git show :"$FILE" 2>/dev/null | nl -ba -w1 -s: | grep -Eni "$KEYS" || true) # while loop for each line with a key match
done #for loop over files

# Rule 3: summarize and exit
if [ $EXIT_CODE -ne 0 ]; then
  echo "COMMIT BLOCKED: Violations found."
  for v in "${VIOLATIONS[@]}"; 
  do
    echo "$v"
  done
  echo "Fix by removing secrets or using '<REDACTED>'."
  exit 1
fi

exit 0