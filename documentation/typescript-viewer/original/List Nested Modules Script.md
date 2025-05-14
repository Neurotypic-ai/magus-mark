---
nexus: nexus-ai-chat-importer
provider: chatgpt
aliases: List Nested Modules Script
conversation_id: f7ef0e65-f256-452f-be92-a9a7faf244c0
create_time: 07/21/2024 at 6:25 AM
update_time: 01/21/2025 at 8:46 PM
tags:
---

# Title: List Nested Modules Script

Created: 07/21/2024 at 6:25 AM Last Updated: 01/21/2025 at 8:46 PM

### User, on 07/21/2024 at 6:25 AM;

> You an expert in typescript and yarn. Write a script that reads my package.json, then it goes into my node_modules
> folder and for each package inside the folder it should go into it, if there is a node_modules folder inside the
> subdirectory, find any directory that is not named .bin and list it.

<!-- UID: dc53797e-e7b3-4554-abbe-f3d228e010f2 -->

#### ChatGPT, on 07/21/2024 at 6:25 AM;

> > Here is a TypeScript script that does exactly what you described. It reads the `package.json` file, navigates into
> > the `node_modules` directory, and for each package, it checks for nested `node_modules` folders, listing any
> > subdirectory that is not named `.bin`.
> >
> > Make sure you have `typescript` and `ts-node` installed globally to run this script, or add them as devDependencies
> > in your project.
> >
> > ```typescript
> > import * as fs from 'fs';
> > import * as path from 'path';
> >
> > const PACKAGE_JSON_PATH = path.join(process.cwd(), 'package.json');
> > const NODE_MODULES_PATH = path.join(process.cwd(), 'node_modules');
> >
> > function readPackageJson() {
> >   if (!fs.existsSync(PACKAGE_JSON_PATH)) {
> >     console.error('package.json not found');
> >     process.exit(1);
> >   }
> >
> >   const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
> >   return packageJson;
> > }
> >
> > function listDirectories(directoryPath: string): string[] {
> >   return fs
> >     .readdirSync(directoryPath, { withFileTypes: true })
> >     .filter((dirent) => dirent.isDirectory() && dirent.name !== '.bin')
> >     .map((dirent) => dirent.name);
> > }
> >
> > function findNestedNodeModules(dirPath: string) {
> >   const nestedNodeModulesPath = path.join(dirPath, 'node_modules');
> >   if (fs.existsSync(nestedNodeModulesPath)) {
> >     const directories = listDirectories(nestedNodeModulesPath);
> >     if (directories.length > 0) {
> >       console.log(`Inside ${nestedNodeModulesPath}:`);
> >       directories.forEach((dir) => console.log(`  - ${dir}`));
> >     }
> >   }
> > }
> >
> > function main() {
> >   const packageJson = readPackageJson();
> >
> >   if (!fs.existsSync(NODE_MODULES_PATH)) {
> >     console.error('node_modules directory not found');
> >     process.exit(1);
> >   }
> >
> >   const packages = listDirectories(NODE_MODULES_PATH);
> >   packages.forEach((pkg) => {
> >     const pkgPath = path.join(NODE_MODULES_PATH, pkg);
> >     findNestedNodeModules(pkgPath);
> >   });
> > }
> >
> > main();
> > ```
> >
> > ### Instructions to Run:
> >
> > 1.  **Install TypeScript and ts-node**:
> >     ```bash
> >     npm install -g typescript ts-node
> >     ```
> > 2.  **Save the script** to a file, e.g., `listNestedModules.ts`.
> > 3.  **Run the script**:
> >     ```bash
> >     ts-node listNestedModules.ts
> >     ```
> >
> > This script will print out all subdirectories found in nested `node_modules` folders that are not named `.bin`.

<!-- UID: 855df02a-3954-48e0-83b3-6699f0d4b261 -->

---

### User, on 01/21/2025 at 8:45 PM;

> bumping up the list. no reply required.

<!-- UID: aaa2e43e-3d5f-471f-9cc3-77fa0b92889f -->

#### ChatGPT, on 01/21/2025 at 8:45 PM;

> > Got it. Let me know when you're ready for the next step or modifications.

<!-- UID: 3f54ab89-663a-4fd6-9c83-affd6e93a2a8 -->

---
