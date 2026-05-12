# Obsidian Integration for Marketing Management

Integrate Obsidian to transform the current marketing automation into a structured, linked knowledge base for better tracking and "advanced management".

## User Review Required

> [!NOTE]
> I will create a new directory named `marketing_vault` within the project. You can "Open Folder as Vault" in Obsidian to this directory.

> [!IMPORTANT]
> I will reorganize existing scripts to output content into this vault instead of individual files in the root.

## Proposed Changes

### [Obsidian Structure Setup]

#### [NEW] `marketing_vault/` [DIRECTORY]
The core vault structure:
- `/Targets`: Individual notes for each apartment/region.
- `/Manuscripts`: Content by date and channel.
- `/Assets`: Images and screenshots.
- `/Calendar`: Daily viral packages.
- `Dashboard.md`: Main overview using Obsidian Dataview-compatible format.

### [Engine Update]

#### [MODIFY] [content_generator.js](file:///c:/jincenchoproject/engine/content_generator.js)
Update the output logic to include YAML frontmatter (e.g., `date`, `target`, `channel`, `status`) and save files into the `marketing_vault`.

#### [MODIFY] [generate_full_package.js](file:///c:/jincenchoproject/engine/generate_full_package.js)
Redirect the "Monday Package" and other daily reports to the `marketing_vault/Calendar` folder.

### [Target Management]

#### [NEW] `marketing_vault/scripts/sync_targets.js`
A script to convert `viral_targets.json` into individual Markdown notes in the `Targets` folder with proper links.

## Verification Plan

### Manual Verification
- Run the sync script and verify that target notes are created.
- Generate today's package and check if it appears in the vault with correct metadata.
- Open the vault in Obsidian and verify that internal links (e.g., `[[Ulsan Munsu Prugio]]`) work correctly.
