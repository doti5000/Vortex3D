// Luau Type Stripper & Syntax Pre-processor
// Converts typed Luau code into WASM-compatible Lua code

export class LuauTranspiler {
  static transpile(luauCode) {
    if (!luauCode) return '';

    let code = luauCode;

    // 1. Strip type declarations (e.g. "type Point = { x: number, y: number }")
    code = code.replace(/export\s+type\s+\w+\s*=\s*[^;\n]+/g, '');
    code = code.replace(/type\s+\w+\s*=\s*[^;\n]+/g, '');

    // 2. Strip variable type annotations (e.g. "local x: number = 10" -> "local x = 10")
    code = code.replace(/local\s+([a-zA-Z0-9_]+)\s*:\s*[a-zA-Z0-9_<>|\{\}\s\.]+\s*=/g, 'local $1 =');

    // 3. Strip function parameter and return type annotations (e.g. "function foo(a: number, b: string): boolean")
    code = code.replace(/function\s+([a-zA-Z0-9_\:\.]+)\s*\(([^)]*)\)\s*:\s*[a-zA-Z0-9_<>|\{\}\s\.]+/g, (match, fnName, args) => {
      const cleanArgs = args.split(',').map(arg => arg.split(':')[0].trim()).join(', ');
      return `function ${fnName}(${cleanArgs})`;
    });

    // 4. Strip inline argument types in anonymous functions
    code = code.replace(/\(([^)]*)\)\s*:\s*[a-zA-Z0-9_<>|\{\}\s\.]+\s*->/g, '($1) ->');

    // 5. Replace Luau compound assignment operators if present (e.g., +=, -=, *=, /=)
    code = code.replace(/([a-zA-Z0-9_\.]+)\s*\+=\s*([^;\n]+)/g, '$1 = $1 + ($2)');
    code = code.replace(/([a-zA-Z0-9_\.]+)\s*-=\s*([^;\n]+)/g, '$1 = $1 - ($2)');
    code = code.replace(/([a-zA-Z0-9_\.]+)\s*\*=\s*([^;\n]+)/g, '$1 = $1 * ($2)');
    code = code.replace(/([a-zA-Z0-9_\.]+)\s*\/=\s*([^;\n]+)/g, '$1 = $1 / ($2)');

    return code;
  }
}
