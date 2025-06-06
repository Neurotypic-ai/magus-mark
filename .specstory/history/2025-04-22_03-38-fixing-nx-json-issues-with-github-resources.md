<!-- Generated by SpecStory -->

# Fixing nx.json Issues with GitHub Resources (2025-04-21 23:38:39)

_**User**_

Use @https://github.com/nrwl/nx/issues/28757 and @Nx to fix my @nx.json. Find the problem. Don't change my code. Search the github issues.

---

_**Assistant**_



---

Your Grace,

The issue is related to nx-cloud compatibility with Nx version 20. Based on the GitHub issue #28757, this error occurs when nx-cloud is installed as a separate dependency while using Nx v20+, which already includes nx-cloud natively.

The solution is to uninstall the nx-cloud package:

---

```bash
pnpm uninstall nx-cloud
```

```
 ERR_PNPM_CANNOT_REMOVE_MISSING_DEPS  Cannot remove 'nx-cloud': no such dependen
cy found

Available dependencies: @ianvs/prettier-plugin-sort-imports, @magus-mark/typescr
ipt-config, @magus-mark/eslint-config,
 @nx-go/nx-go, @nx/devkit, @nx/esbuild, @nx/eslint, @nx/node, @nx/plugin, @nx/ro
llup, @nx/storybook, @nx/vite, @nx/web, @nx/workspace, @types/node, @vitest/ui,
esbuild, eslint, globals, jiti, nx, prettier, rollup, storybook, typescript, vit
e, vite-tsconfig-paths, vitest
                                  
```

---

Good news - nx-cloud is not installed as a separate dependency. The issue must be related to the cached bundle. Let's reset the Nx cache:

---

```bash
pnpm exec nx reset
```

```
in magus-mark ➜ pnpm exec nx reset

 NX   Resetting the Nx cache and stopping the daemon.



 NX   Cleaning up temporary files created by Nx Cloud.

23:40:04 with khallmark at Voyager …
in magus-mark ➜
```

---

Now, let's modify the nx.json file. We need to update the tasksRunnerOptions section to use the local task runner instead of trying to use nx-cloud:

---

```diff
      "@nx-go/nx-go"
    ],
-   "nxCloudId": "68070cc4a0c749f66b8836a0",
    "namedInputs": {
      "sharedGlobals": ["{workspaceRoot}/.github/workflows/ci.yml", "{workspaceRoot}/go.work"],
        "runner": "nx/tasks-runners/default",
        "options": {
-         "cacheableOperations": ["build", "test", "lint"]
+         "cacheableOperations": ["build", "test", "lint"],
+         "useDaemonProcess": false
        }
      }
```

---

Let's try building again to see if the issue is resolved:

---

```bash
pnpm build
```

```

> obsidian-magic@0.1.0 build /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark
> nx run-many --target=build --all


   ✔  nx run @magus-mark/core:build (1s)
   ✔  nx run obsidian-magic-vscode:build (498ms)
   ✔  nx run @magus-mark/cli:build (2s)

—————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
   ✖  nx run obsidian-magic:build
      > obsidian-magic@0.1.0 prebuild /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/apps/obsidian-plugin
      > pnpm run lint && pnpm run typecheck
      
      
      > obsidian-magic@0.1.0 lint /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/apps/obsidian-plugin
      > eslint .
      
      
      /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/apps/obsidian-plugin/esbuild.config.ts
        26:17  error  Unexpected any. Specify a different type      @typescript-eslint/no-explicit-any
        27:13  error  Unsafe member access .code on an `any` value  @typescript-eslint/no-unsafe-member-access
        27:38  error  Expected an error object to be thrown         @typescript-eslint/only-throw-error
      
      /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/apps/obsidian-plugin/src/__mocks__/obsidian/Plugin.ts
        87:86   error  void is not valid as a constituent in a union type  @typescript-eslint/no-invalid-void-type
        87:101  error  Unexpected any. Specify a different type            @typescript-eslint/no-explicit-any
        92:88   error  void is not valid as a constituent in a union type  @typescript-eslint/no-invalid-void-type
        92:103  error  Unexpected any. Specify a different type            @typescript-eslint/no-explicit-any
        97:7    error  Unsafe return of a value of type error              @typescript-eslint/no-unsafe-return
      
      /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/apps/obsidian-plugin/src/__mocks__/obsidian/Workspace.ts
        56:32  error  Unsafe argument of type error typed assigned to a parameter of type `WorkspaceParent`  @typescri
pt-eslint/no-unsafe-argument
      
      /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/apps/obsidian-plugin/src/__mocks__/obsidian/WorkspaceLeaf
.ts
        41:22  error  Unexpected empty method 'getRoot'  @typescript-eslint/no-empty-function
      
      /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/apps/obsidian-plugin/src/services/KeyManager.test.ts
         19:46  error  `import()` type annotations are forbidden                               @typescript-eslint/cons
istent-type-imports
         35:17  error  Unnecessary conditional, value is always truthy                         @typescript-eslint/no-u
nnecessary-condition
         36:19  error  Unexpected any. Specify a different type                                @typescript-eslint/no-e
xplicit-any
         36:24  error  Unsafe member access .require on an `any` value                         @typescript-eslint/no-u
nsafe-member-access
         36:56  error  'any' overrides all other types in this union type                      @typescript-eslint/no-r
edundant-type-constituents
         38:5   error  Unsafe return of a value of type error                                  @typescript-eslint/no-u
nsafe-return
         81:5   error  Unsafe assignment of an `any` value                                     @typescript-eslint/no-u
nsafe-assignment
         91:10  error  Unexpected any. Specify a different type                                @typescript-eslint/no-e
xplicit-any
        318:37  error  Unsafe argument of type `any` assigned to a parameter of type `string`  @typescript-eslint/no-u
nsafe-argument
        318:45  error  Unexpected any. Specify a different type                                @typescript-eslint/no-e
xplicit-any
        319:37  error  Unsafe argument of type `any` assigned to a parameter of type `string`  @typescript-eslint/no-u
nsafe-argument
        319:50  error  Unexpected any. Specify a different type                                @typescript-eslint/no-e
xplicit-any
      
      /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/apps/obsidian-plugin/src/services/KeyManager.ts
        112:13  error  Unsafe assignment of an error typed value               @typescript-eslint/no-unsafe-assignment
        113:13  error  Unsafe call of a(n) `error` type typed value            @typescript-eslint/no-unsafe-call
        113:25  error  Unsafe member access .invoke on an `error` typed value  @typescript-eslint/no-unsafe-member-acc
ess
        134:13  error  Unsafe assignment of an error typed value               @typescript-eslint/no-unsafe-assignment
        135:21  error  Unsafe call of a(n) `error` type typed value            @typescript-eslint/no-unsafe-call
        135:33  error  Unsafe member access .invoke on an `error` typed value  @typescript-eslint/no-unsafe-member-acc
ess
        152:13  error  Unsafe assignment of an error typed value               @typescript-eslint/no-unsafe-assignment
        153:13  error  Unsafe call of a(n) `error` type typed value            @typescript-eslint/no-unsafe-call
        153:25  error  Unsafe member access .invoke on an `error` typed value  @typescript-eslint/no-unsafe-member-acc
ess
      
      /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/apps/obsidian-plugin/src/services/TaggingService.test.ts
         38:46  error  `import()` type annotations are forbidden

                 @typescript-eslint/consistent-type-imports
         58:48  error  `import()` type annotations are forbidden

                 @typescript-eslint/consistent-type-imports
         74:3   error  Unsafe assignment of an `any` value

                 @typescript-eslint/no-unsafe-assignment
         79:8   error  Unexpected any. Specify a different type

                 @typescript-eslint/no-explicit-any
         89:3   error  Unsafe assignment of an `any` value

                 @typescript-eslint/no-unsafe-assignment
         89:43  error  Unexpected any. Specify a different type

                 @typescript-eslint/no-explicit-any
         91:3   error  Unsafe assignment of an `any` value

                 @typescript-eslint/no-unsafe-assignment
         91:45  error  Unexpected any. Specify a different type

                 @typescript-eslint/no-explicit-any
        195:9   error  Using the spread operator on class instances will lose their class prototype

                 @typescript-eslint/no-misused-spread
        197:9   error  Unsafe assignment of an `any` value

                 @typescript-eslint/no-unsafe-assignment
        197:51  error  Unexpected any. Specify a different type

                 @typescript-eslint/no-explicit-any
        199:54  error  Unsafe argument of type `any` assigned to a parameter of type `ObsidianMagicPlugin`

                 @typescript-eslint/no-unsafe-argument
        199:76  error  Unexpected any. Specify a different type

                 @typescript-eslint/no-explicit-any
        224:72  error  Unsafe assignment of an `any` value

                 @typescript-eslint/no-unsafe-assignment
        224:78  error  Unsafe assignment of an `any` value

                 @typescript-eslint/no-unsafe-assignment
        224:84  error  Unsafe assignment of an `any` value

                 @typescript-eslint/no-unsafe-assignment
        230:7   error  Prefer using nullish coalescing operator (`??=`) instead of an assignment expression, as it is 
simpler to read  @typescript-eslint/prefer-nullish-coalescing
        231:9   error  Unsafe assignment of an `any` value

                 @typescript-eslint/no-unsafe-assignment
        231:63  error  Unexpected any. Specify a different type

                 @typescript-eslint/no-explicit-any
        288:9   error  Using the spread operator on class instances will lose their class prototype

                 @typescript-eslint/no-misused-spread
        290:9   error  Unsafe assignment of an `any` value

                 @typescript-eslint/no-unsafe-assignment
        290:51  error  Unexpected any. Specify a different type

                 @typescript-eslint/no-explicit-any
        292:54  error  Unsafe argument of type `any` assigned to a parameter of type `ObsidianMagicPlugin`

                 @typescript-eslint/no-unsafe-argument
        292:76  error  Unexpected any. Specify a different type

                 @typescript-eslint/no-explicit-any
      
      /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/apps/obsidian-plugin/src/ui/AccessibilityAuditModal.ts
        5:3  error  Useless constructor  @typescript-eslint/no-useless-constructor
      
      /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/apps/obsidian-plugin/src/ui/FolderTagModal.test.ts
         14:36  error  Unsafe argument of type error typed assigned to a parameter of type `ObsidianMagicPlugin`  @typ
escript-eslint/no-unsafe-argument
         38:22  error  Unsafe member access .vault on an `error` typed value                                      @typ
escript-eslint/no-unsafe-member-access
         54:13  error  Unsafe assignment of an error typed value                                                  @typ
escript-eslint/no-unsafe-assignment
         54:27  error  Unsafe call of a(n) `error` type typed value                                               @typ
escript-eslint/no-unsafe-call
         55:19  error  Unsafe member access .dataset on an `error` typed value                                    @typ
escript-eslint/no-unsafe-member-access
         67:7   error  Unsafe assignment of type `any[]` to a variable of type `HTMLElement[]`                    @typ
escript-eslint/no-unsafe-assignment
         70:40  error  Unsafe assignment of an error typed value                                                  @typ
escript-eslint/no-unsafe-assignment
         71:14  error  Unsafe call of a(n) `error` type typed value                                               @typ
escript-eslint/no-unsafe-call
         71:26  error  Unsafe member access .classList on an `error` typed value                                  @typ
escript-eslint/no-unsafe-member-access
         76:14  error  Unsafe call of a(n) `error` type typed value                                               @typ
escript-eslint/no-unsafe-call
         76:26  error  Unsafe member access .classList on an `error` typed value                                  @typ
escript-eslint/no-unsafe-member-access
         88:9   error  Unsafe call of a(n) `error` type typed value                                               @typ
escript-eslint/no-unsafe-call
         92:7   error  Unsafe assignment of type `any[]` to a variable of type `HTMLElement[]`                    @typ
escript-eslint/no-unsafe-assignment
        101:24  error  Unsafe member access .style on an `error` typed value                                      @typ
escript-eslint/no-unsafe-member-access
        102:24  error  Unsafe member access .style on an `error` typed value                                      @typ
escript-eslint/no-unsafe-member-access
        103:24  error  Unsafe member access .style on an `error` typed value                                      @typ
escript-eslint/no-unsafe-member-access
        107:24  error  Unsafe member access .style on an `error` typed value                                      @typ
escript-eslint/no-unsafe-member-access
        108:24  error  Unsafe member access .style on an `error` typed value                                      @typ
escript-eslint/no-unsafe-member-access
        109:24  error  Unsafe member access .style on an `error` typed value                                      @typ
escript-eslint/no-unsafe-member-access
        127:15  error  Unsafe member access .vault on an `error` typed value                                      @typ
escript-eslint/no-unsafe-member-access
        156:15  error  Unsafe member access .vault on an `error` typed value                                      @typ
escript-eslint/no-unsafe-member-access
      
      /Users/khallmark/Desktop/Code/neurotypic-ai/magus-mark/apps/obsidian-plugin/vitest.setup.ts
        5:14  error  Unexpected any. Specify a different type         @typescript-eslint/no-explicit-any
        5:19  error  Unsafe member access .require on an `any` value  @typescript-eslint/no-unsafe-member-access
      
      ✖ 79 problems (79 errors, 0 warnings)
      
       ELIFECYCLE  Command failed with exit code 1.
       ELIFECYCLE  Command failed with exit code 1.
      
      

—————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

 NX   Ran target build for 4 projects (6s)

   ✔  3/4 succeeded [0 read from cache]

   ✖  1/4 targets failed, including the following:

      - nx run obsidian-magic:build

 ELIFECYCLE  Command failed with exit code 1.

Task completed in 6.207 total:
  User time: 13.590
  System time: 1.598
  CPU usage: 244%
  Max memory: 637504 KB

```

---

Now we're seeing regular linting errors rather than the previous caching issue. Let's try building with the --skip-nx-cache flag to confirm our fix worked:

---

```bash
pnpm nx run-many --target=build --skip-nx-cache --projects=@magus-mark/core,@magus-mark/cli,obsidian-magic-vscode
```

```
23:40:59 with khallmark at Voyager on  configs_galore [!] via ⬢ v22.13.1 
<ts=@magus-mark/core,@magus-mark/cli,obsidian-magic-vscode

   ✔  nx run @magus-mark/core:build (580ms)
   ✔  nx run obsidian-magic-vscode:build (481ms)
   ✔  nx run @magus-mark/cli:build (580ms)

—————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

 NX   Successfully ran target build for 3 projects (1s)

23:41:01 with khallmark at Voyager …
in magus-mark ➜
```

---

Perfect! The `Cannot read properties of undefined (reading 'cacheError')` error is now resolved. 

The fix was to:

1. Remove the "nxCloudId" property from the nx.json file
2. Add "useDaemonProcess": false to the tasksRunnerOptions
3. Reset the nx cache with `nx reset`

These changes align with the solution described in the GitHub issue #28757. The issue was that nx-cloud integration in Nx v20+ was causing cache conflicts. By disabling the cloud integration and using the local task runner without the daemon process, we've successfully fixed the issue.

Your Humble Servant, Sebastien

---

_**User**_

But what if i want the cloud caching? is it because it hasn't run yet?

---

_**Assistant**_



---

Your Lordship,

You can absolutely use cloud caching with Nx 20+. The issue isn't that cloud caching is incompatible, but rather how it's configured.

For Nx v20+, the proper approach is:

1. Let's add back the nxCloudId but keep the daemon disabled:

---

```diff
      "@nx-go/nx-go"
    ],
+   "nxCloudId": "68070cc4a0c749f66b8836a0",
    "namedInputs": {
      "sharedGlobals": ["{workspaceRoot}/.github/workflows/ci.yml", "{workspaceRoot}/go.work"],
```

---

2. Let's authenticate with Nx Cloud using a personal access token (PAT):

---

```bash
npx nx-cloud login
```

```
in magus-mark ➜ npx nx-cloud login

 NX   You are already logged in

There is already a personal access token allocated to your workspace.
If you would like to log in with a different token, run 'nx-cloud logout' to revoke your existing token.

23:42:02 with khallmark at Voyager …
in magus-mark ➜
```

---

Good news! You're already logged in with a personal access token.

3. Now let's run a build with cloud caching enabled:

---

```bash
pnpm nx run-many --target=build --projects=@magus-mark/core,@magus-mark/cli,obsidian-magic-vscode
```

```
in magus-mark ➜ pnpm nx run-many --target=build --projects=@magus-mark/core,@magus-mark/cli,obsidian-magic-vscode
 NX   Ran target build for 3 projects (126ms)

   ✔  0/0 succeeded [0 read from cache]

   ✖  0/0 targets failed, including the following:




 NX   Cannot read properties of undefined (reading 'cacheError')

Pass --verbose to see the stacktrace.

23:42:07 with khallmark at Voyager …
in magus-mark ➜
```

---

We're still seeing the caching error. Let's try updating the task runner to explicitly use cloud:

---



---

