# Logs Directory

This directory contains log files for the application when running in production mode.

## Log Files

- `error.log` - Contains error-level logs only
- `combined.log` - Contains all log levels (debug, info, warn, error)

## Notes

- Log files are automatically created when the application starts in production
- Ensure this directory has appropriate write permissions
- Consider log rotation for production deployments
- Log files are excluded from git via .gitignore
