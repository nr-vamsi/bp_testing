# Copilot Instructions for Billingplatform FastTrak Testing Tool

## Overview
This monorepo contains several related Node.js/JavaScript projects for billing platform testing and utilities. Each main folder (e.g., `BP_Testing_FrontEnd_Application`, `UsageFileGenerator`, `BPGenericUtility`) is a mostly self-contained app or utility, but they share similar structure and CSV data conventions.

## Architecture & Data Flow
- **Front-end apps** (e.g., `BP_Testing_FrontEnd_Application/src/`) are simple HTML/CSS/JS UIs, served by a Node.js backend (`server.js`).
- **CSV files** in each project (under `csv/`) are the primary data source for products, usage mappings, and templates. These are read and processed by backend scripts.
- **`src/` directory** in each project contains the main logic: UI (`index.html`, `styles.css`), business logic (various `*.js`), and utility scripts.
- **`usageFiles/`** directories are used for generated or processed usage data.

## Developer Workflows
- **Install dependencies:** `npm install` in each project folder.
- **Run server:** `node server.js` (default port: 3000, see code for overrides).
- **No build step** is required; code is run directly with Node.js.
- **No formal test suite** is present; manual testing via the UI and CSV file outputs is standard.

## Project Conventions
- **CSV-driven logic:** Most business logic is driven by the structure/content of CSVs in `csv/`. When adding new products or mappings, update these files and ensure corresponding JS logic reads them.
- **No frameworks:** Pure Node.js and vanilla JS/HTML/CSS. No React, no TypeScript, no transpilers.
- **File naming:** Scripts are named for their function (e.g., `createAccount.js`, `queryPrice.js`).
- **Duplication:** Many scripts are duplicated across projects; changes may need to be applied in multiple places.

## Integration Points
- **No external APIs** are called by default; all data is local.
- **To add new data sources**, place new CSVs in the appropriate `csv/` folder and update JS logic to read them.

## Examples
- To add a new product: update `csv/productList.csv` and ensure `fetchProducts.js` and related scripts handle the new entry.
- To generate usage files: run the relevant script in `src/` (e.g., `createUsageFiles.js`), which will read from `csv/` and output to `usageFiles/`.

## Key Files & Directories
- `src/index.html`, `src/styles.css`, `src/app.js` — UI and main logic
- `csv/` — All product, mapping, and template data
- `usageFiles/` — Output directory for generated usage data
- `server.js` — Node.js server entry point

---
For more details, see the `README.md` in each project folder. If you update CSV formats, document the changes in the relevant `README.md` and update all affected scripts.
