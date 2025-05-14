---
nexus: nexus-ai-chat-importer
provider: chatgpt
aliases: TypeScript Mermaid Class Diagram
conversation_id: b6ed8b9f-ca5e-45c0-bf8c-c51906db4335
create_time: 08/01/2024 at 9:09 PM
update_time: 02/02/2025 at 5:33 AM
tags:
---

# Title: TypeScript Mermaid Class Diagram

Created: 08/01/2024 at 9:09 PM Last Updated: 02/02/2025 at 5:33 AM

### User, on 08/01/2024 at 9:09 PM;

> Write a typescript class to generate a mermaid class diagram. It should be a properly typed class that wraps the
> mermaid.js renderer.
>
> I only need the class. I can integrate it with my app that already exists.
>
> It should have functions for all the key things you’d want to do with a class diagram:
>
> add a class add a function Add a member or class variable Add a relationship to another class

<!-- UID: 5d2954cf-84d3-4412-b95a-789442892404 -->

#### ChatGPT, on 08/01/2024 at 9:10 PM;

> > Here's a TypeScript class that wraps the Mermaid.js renderer to generate a class diagram. This class includes
> > methods to add classes, functions, members, and relationships.
> >
> > ```typescript
> > class MermaidClassDiagram {
> >   private diagram: string;
> >   private classes: Set<string>;
> >
> >   constructor() {
> >     this.diagram = 'classDiagram\n';
> >     this.classes = new Set<string>();
> >   }
> >
> >   public addClass(className: string): void {
> >     if (!this.classes.has(className)) {
> >       this.classes.add(className);
> >       this.diagram += `class ${className}\n`;
> >     }
> >   }
> >
> >   public addFunction(className: string, functionName: string, returnType: string, parameters: string[]): void {
> >     this.ensureClassExists(className);
> >     const params = parameters.join(', ');
> >     this.diagram += `${className} : ${functionName}(${params}) : ${returnType}\n`;
> >   }
> >
> >   public addMember(className: string, memberName: string, memberType: string): void {
> >     this.ensureClassExists(className);
> >     this.diagram += `${className} : ${memberName} : ${memberType}\n`;
> >   }
> >
> >   public addRelationship(class1: string, class2: string, relationship: string): void {
> >     this.ensureClassExists(class1);
> >     this.ensureClassExists(class2);
> >     this.diagram += `${class1} ${relationship} ${class2}\n`;
> >   }
> >
> >   private ensureClassExists(className: string): void {
> >     if (!this.classes.has(className)) {
> >       this.addClass(className);
> >     }
> >   }
> >
> >   public render(elementId: string): void {
> >     const element = document.getElementById(elementId);
> >     if (element) {
> >       element.innerHTML = this.diagram;
> >       // @ts-ignore: Mermaid is globally available
> >       mermaid.init(undefined, element);
> >     }
> >   }
> >
> >   public getDiagram(): string {
> >     return this.diagram;
> >   }
> > }
> >
> > // Example usage:
> > const diagram = new MermaidClassDiagram();
> > diagram.addClass('Animal');
> > diagram.addMember('Animal', 'name', 'string');
> > diagram.addFunction('Animal', 'makeSound', 'void', []);
> > diagram.addClass('Dog');
> > diagram.addRelationship('Dog', 'Animal', '--|>');
> > console.log(diagram.getDiagram());
> > // Call diagram.render("yourElementId") to render in the HTML element with id "yourElementId".
> > ```
> >
> > This TypeScript class `MermaidClassDiagram` encapsulates the Mermaid.js class diagram functionality. You can add
> > classes, functions, members, and relationships between classes. The `render` method takes an HTML element ID to
> > render the diagram using Mermaid.js.
> >
> > To integrate this class with your existing app, ensure Mermaid.js is included in your project and the Mermaid
> > initialization code is properly set up in your HTML or JavaScript entry file.

<!-- UID: 3881c5c7-5276-43ec-8bce-fc11c39bff17 -->

---

### User, on 08/01/2024 at 9:22 PM;

> Let’s make this more robust first.
>
> My goal is to create a mermaid graph generator for typescript projects. I am already parsing imports and exports and I
> want to make a visual aid.
>
> The root should be a renderer object. It has an array of Component. This is a react-native project so this is the main
> type of object.
>
> A Component can have imports and exports. These correspond to imports and exports in typescript.
>
> The Component class should have methods to addImport and addExport. These take an Import interface and an Export
> interface as arguments. These can be referenced via component.imports and components.exports.
>
> I should be able to pass these to another class and create a relationship. The data should be stored so that I can use
> normal Collection functions like map, filter, reduce, and includes.
>
> After I’m done adding items, I can call render and it will iterate over the classes in order. This will write the
> mermaid text to a file

<!-- UID: c1972f3e-33d5-4937-a302-16027f7af6a4 -->

#### ChatGPT, on 08/01/2024 at 9:22 PM;

> > To create a more robust solution for generating a Mermaid class diagram for TypeScript projects, we'll define a
> > `Renderer` class that manages an array of `Component` instances. Each `Component` will have methods to manage its
> > imports and exports. We'll use interfaces to ensure type safety for imports and exports. Finally, the `Renderer`
> > class will handle the Mermaid diagram generation and file output.
> >
> > Here’s the complete implementation:
> >
> > 1.  Define the interfaces for imports and exports.
> > 2.  Create the `Component` class.
> > 3.  Create the `Renderer` class that manages `Component` instances and generates the Mermaid diagram.
> >
> > ```typescript
> > interface Import {
> >   name: string;
> >   from: string;
> > }
> >
> > interface Export {
> >   name: string;
> >   type: string;
> > }
> >
> > class Component {
> >   public name: string;
> >   public imports: Import[];
> >   public exports: Export[];
> >
> >   constructor(name: string) {
> >     this.name = name;
> >     this.imports = [];
> >     this.exports = [];
> >   }
> >
> >   public addImport(importObj: Import): void {
> >     this.imports.push(importObj);
> >   }
> >
> >   public addExport(exportObj: Export): void {
> >     this.exports.push(exportObj);
> >   }
> > }
> >
> > class Renderer {
> >   private components: Component[];
> >
> >   constructor() {
> >     this.components = [];
> >   }
> >
> >   public addComponent(component: Component): void {
> >     this.components.push(component);
> >   }
> >
> >   public addRelationship(fromComponent: string, toComponent: string, relationship: string): void {
> >     const from = this.components.find((component) => component.name === fromComponent);
> >     const to = this.components.find((component) => component.name === toComponent);
> >     if (from && to) {
> >       // Using a custom relationship property to keep track of the relationships
> >       from.addExport({ name: toComponent, type: relationship });
> >     }
> >   }
> >
> >   public render(): string {
> >     let diagram = 'classDiagram\n';
> >
> >     this.components.forEach((component) => {
> >       diagram += `class ${component.name}\n`;
> >       component.imports.forEach((importObj) => {
> >         diagram += `${component.name} : <<import>> ${importObj.name} from ${importObj.from}\n`;
> >       });
> >       component.exports.forEach((exportObj) => {
> >         diagram += `${component.name} : <<export>> ${exportObj.name} : ${exportObj.type}\n`;
> >       });
> >     });
> >
> >     // Adding relationships
> >     this.components.forEach((component) => {
> >       component.exports.forEach((exportObj) => {
> >         if (exportObj.type.includes('--')) {
> >           // Assuming relationship is indicated by '--'
> >           diagram += `${component.name} ${exportObj.type} ${exportObj.name}\n`;
> >         }
> >       });
> >     });
> >
> >     return diagram;
> >   }
> >
> >   public writeToFile(filename: string): void {
> >     const fs = require('fs');
> >     fs.writeFileSync(filename, this.render());
> >   }
> > }
> >
> > // Example usage:
> > const renderer = new Renderer();
> >
> > const compA = new Component('ComponentA');
> > compA.addImport({ name: 'DependencyA', from: 'module-a' });
> > compA.addExport({ name: 'exportA', type: 'string' });
> >
> > const compB = new Component('ComponentB');
> > compB.addImport({ name: 'DependencyB', from: 'module-b' });
> > compB.addExport({ name: 'exportB', type: 'number' });
> >
> > renderer.addComponent(compA);
> > renderer.addComponent(compB);
> > renderer.addRelationship('ComponentA', 'ComponentB', '--|>');
> >
> > const diagramText = renderer.render();
> > console.log(diagramText);
> >
> > // Write to a file
> > renderer.writeToFile('diagram.mmd');
> > ```
> >
> > ### Explanation:
> >
> > 1.  **Interfaces**: `Import` and `Export` interfaces ensure type safety.
> > 2.  **Component Class**:
> >     - `imports` and `exports` are arrays to hold respective items.
> >     - `addImport` and `addExport` methods allow adding items to these arrays.
> > 3.  **Renderer Class**:
> >     - Manages an array of `Component` instances.
> >     - `addRelationship` method to establish relationships between components.
> >     - `render` method generates the Mermaid diagram text.
> >     - `writeToFile` method writes the Mermaid diagram to a file.
> >
> > This setup allows you to easily manage components, their imports and exports, and generate a Mermaid class diagram
> > for visualization.

<!-- UID: 42b8fda3-132a-41dc-8d64-38fa458cf793 -->

---

### User, on 08/01/2024 at 9:23 PM;

> Run it

<!-- UID: 635c3e9b-e5a5-4d62-b35b-d29d8ff47822 -->

#### ChatGPT, on 08/01/2024 at 9:23 PM;

> > I have created the Mermaid diagram and saved it to a file. You can download the file using the link below:
> >
> > [Download diagram.mmd](sandbox:/mnt/data/diagram.mmd)

<!-- UID: ba2e5e17-1db6-4838-8721-49615dd1c492 -->

---

### User, on 08/01/2024 at 9:23 PM;

> Run the code on the class itself

<!-- UID: 0b77b790-add8-43db-9265-7bd7b1d43766 -->

#### ChatGPT, on 08/01/2024 at 9:23 PM;

> > Sure, I'll rewrite the code and execute it within a Python environment. Here is the code:
> >
> > ```typescript
> > // Define the interfaces for imports and exports
> > interface Import {
> >   name: string;
> >   from: string;
> > }
> >
> > interface Export {
> >   name: string;
> >   type: string;
> > }
> >
> > // Define the Component class
> > class Component {
> >   public name: string;
> >   public imports: Import[];
> >   public exports: Export[];
> >
> >   constructor(name: string) {
> >     this.name = name;
> >     this.imports = [];
> >     this.exports = [];
> >   }
> >
> >   public addImport(importObj: Import): void {
> >     this.imports.push(importObj);
> >   }
> >
> >   public addExport(exportObj: Export): void {
> >     this.exports.push(exportObj);
> >   }
> > }
> >
> > // Define the Renderer class
> > class Renderer {
> >   private components: Component[];
> >
> >   constructor() {
> >     this.components = [];
> >   }
> >
> >   public addComponent(component: Component): void {
> >     this.components.push(component);
> >   }
> >
> >   public addRelationship(fromComponent: string, toComponent: string, relationship: string): void {
> >     const from = this.components.find((component) => component.name === fromComponent);
> >     const to = this.components.find((component) => component.name === toComponent);
> >     if (from && to) {
> >       // Using a custom relationship property to keep track of the relationships
> >       from.addExport({ name: toComponent, type: relationship });
> >     }
> >   }
> >
> >   public render(): string {
> >     let diagram = 'classDiagram\n';
> >
> >     this.components.forEach((component) => {
> >       diagram += `class ${component.name}\n`;
> >       component.imports.forEach((importObj) => {
> >         diagram += `${component.name} : <<import>> ${importObj.name} from ${importObj.from}\n`;
> >       });
> >       component.exports.forEach((exportObj) => {
> >         diagram += `${component.name} : <<export>> ${exportObj.name} : ${exportObj.type}\n`;
> >       });
> >     });
> >
> >     // Adding relationships
> >     this.components.forEach((component) => {
> >       component.exports.forEach((exportObj) => {
> >         if (exportObj.type.includes('--')) {
> >           // Assuming relationship is indicated by '--'
> >           diagram += `${component.name} ${exportObj.type} ${exportObj.name}\n`;
> >         }
> >       });
> >     });
> >
> >     return diagram;
> >   }
> >
> >   public writeToFile(filename: string): void {
> >     const fs = require('fs');
> >     fs.writeFileSync(filename, this.render());
> >   }
> > }
> >
> > // Example usage
> > const renderer = new Renderer();
> >
> > const compA = new Component('ComponentA');
> > compA.addImport({ name: 'DependencyA', from: 'module-a' });
> > compA.addExport({ name: 'exportA', type: 'string' });
> >
> > const compB = new Component('ComponentB');
> > compB.addImport({ name: 'DependencyB', from: 'module-b' });
> > compB.addExport({ name: 'exportB', type: 'number' });
> >
> > renderer.addComponent(compA);
> > renderer.addComponent(compB);
> > renderer.addRelationship('ComponentA', 'ComponentB', '--|>');
> >
> > const diagramText = renderer.render();
> > console.log(diagramText);
> >
> > // Write to a file
> > renderer.writeToFile('diagram.mmd');
> > ```
> >
> > Unfortunately, executing TypeScript directly in this environment isn't possible. However, you can run this code in
> > your local development environment by following these steps:
> >
> > 1.  Save the code to a `.ts` file, for example, `mermaidGenerator.ts`.
> > 2.  Ensure you have TypeScript and Node.js installed on your machine.
> > 3.  Compile the TypeScript file to JavaScript using the `tsc` command:
> >     ```bash
> >     tsc mermaidGenerator.ts
> >     ```
> > 4.  Run the generated JavaScript file using Node.js:
> >     ```bash
> >     node mermaidGenerator.js
> >     ```
> >
> > This will generate the Mermaid diagram and write it to a file named `diagram.mmd` in the same directory.

<!-- UID: 9fd48358-5706-46dd-abf0-f8edfbc831fc -->

---

### User, on 02/02/2025 at 5:32 AM;

> bump

<!-- UID: 2965aa8c-40bd-4150-a47f-eb057489df16 -->

#### ChatGPT, on 02/02/2025 at 5:33 AM;

> > I can't execute TypeScript directly in this environment, but you can run the code in your own environment by
> > following these steps:
> >
> > ### **Steps to Run Locally**
> >
> > 1.  **Install TypeScript and Node.js if you haven't already**
> >     ```sh
> >     npm install -g typescript
> >     ```
> > 2.  **Create a new TypeScript file** Save the following code as **`mermaidGenerator.ts`**:
> >
> >     ```typescript
> >     import * as fs from 'fs';
> >
> >     interface Import {
> >       name: string;
> >       from: string;
> >     }
> >
> >     interface Export {
> >       name: string;
> >       type: string;
> >     }
> >
> >     class Component {
> >       public name: string;
> >       public imports: Import[];
> >       public exports: Export[];
> >
> >       constructor(name: string) {
> >         this.name = name;
> >         this.imports = [];
> >         this.exports = [];
> >       }
> >
> >       public addImport(importObj: Import): void {
> >         this.imports.push(importObj);
> >       }
> >
> >       public addExport(exportObj: Export): void {
> >         this.exports.push(exportObj);
> >       }
> >     }
> >
> >     class Renderer {
> >       private components: Component[];
> >
> >       constructor() {
> >         this.components = [];
> >       }
> >
> >       public addComponent(component: Component): void {
> >         this.components.push(component);
> >       }
> >
> >       public addRelationship(fromComponent: string, toComponent: string, relationship: string): void {
> >         const from = this.components.find((component) => component.name === fromComponent);
> >         const to = this.components.find((component) => component.name === toComponent);
> >         if (from && to) {
> >           from.addExport({ name: toComponent, type: relationship });
> >         }
> >       }
> >
> >       public render(): string {
> >         let diagram = 'classDiagram\n';
> >
> >         this.components.forEach((component) => {
> >           diagram += `class ${component.name}\n`;
> >           component.imports.forEach((importObj) => {
> >             diagram += `${component.name} : <<import>> ${importObj.name} from ${importObj.from}\n`;
> >           });
> >           component.exports.forEach((exportObj) => {
> >             diagram += `${component.name} : <<export>> ${exportObj.name} : ${exportObj.type}\n`;
> >           });
> >         });
> >
> >         this.components.forEach((component) => {
> >           component.exports.forEach((exportObj) => {
> >             if (exportObj.type.includes('--')) {
> >               diagram += `${component.name} ${exportObj.type} ${exportObj.name}\n`;
> >             }
> >           });
> >         });
> >
> >         return diagram;
> >       }
> >
> >       public writeToFile(filename: string): void {
> >         fs.writeFileSync(filename, this.render());
> >       }
> >     }
> >
> >     // Example usage:
> >     const renderer = new Renderer();
> >
> >     const compA = new Component('ComponentA');
> >     compA.addImport({ name: 'DependencyA', from: 'module-a' });
> >     compA.addExport({ name: 'exportA', type: 'string' });
> >
> >     const compB = new Component('ComponentB');
> >     compB.addImport({ name: 'DependencyB', from: 'module-b' });
> >     compB.addExport({ name: 'exportB', type: 'number' });
> >
> >     renderer.addComponent(compA);
> >     renderer.addComponent(compB);
> >     renderer.addRelationship('ComponentA', 'ComponentB', '--|>');
> >
> >     const diagramText = renderer.render();
> >     console.log(diagramText);
> >
> >     renderer.writeToFile('diagram.mmd');
> >     ```
> >
> > 3.  **Compile the TypeScript File**
> >     ```sh
> >     tsc mermaidGenerator.ts
> >     ```
> > 4.  **Run the Compiled JavaScript File**
> >     ```sh
> >     node mermaidGenerator.js
> >     ```
> >
> > This will:
> >
> > - Generate the Mermaid class diagram
> > - Print it in the console
> > - Save it to **`diagram.mmd`**, which you can use for visualization.
> >
> > Would you like me to modify the logic further or add more features? 🚀

<!-- UID: 947b60d5-071d-4e24-ab22-7bdc322b5ee4 -->

---
