async function foo() {
    const p1 = await new Promise((resolve) => resolve('1') /*setTimeout(() => resolve('1'), 1000)*/)
   // const p2 = new Promise((resolve) => setTimeout(() => resolve('2'), 500))
   // const results = [await p1, await p2] // Do not do this! Use Promise.all or Promise.allSettled instead.
    console.log(p1)
 }
 foo().catch(() => {}) // Attempt to swallow all errors...
 
 