A tool for benchmarking fine grained reactive frameworks.

```
$ pnpm bench
```
output is a csv file which you can read manually, 
or feed into your favorite spreadsheet or dataviz tool.


# Features
* Configurable dependency graph: graph shape, density, read rate are all adjustable.
* Supports dynamic reactive nodes
* Framework agnostic. Simple API to test new reactive frameworks.
* Runs benchmarks under nodeJs for convenience and continuous integration.
* Optionally runs benchmarks in a browser for debugging (using cypress)
* Uses v8 intrinsics to warmup and cleanup
* Tracks garbage collection overhead per test
* Outputs a csv file for easy integration with other tools.
<table>
  <tr>
    <td> 
      <img width="400" alt="Screen Shot 2022-11-16 at 10 34 09 AM" src="https://user-images.githubusercontent.com/63816/202264375-04f15400-bb36-424c-8bb3-ac149491d4ac.png">
    </td>
    <td>
      <img width="400" alt="image" src="https://user-images.githubusercontent.com/63816/202264535-e181bf3b-4444-43d8-8d06-afd56a1297e7.png">
    </td>
  </tr>
</table>

# Usage
Run benchmarks in node:
```
$ pnpm bench 

# run each benchmark 8 times, report the fastest time
$ pnpm bench - --repeats 8

```

Run benchmarks in browser:

```
$ cd ../cypress
$ pnpm component-test
```
Note that browser tests currently run once.

# Creating new test configurations
1. Add an entry to the `TestConfig` list in `PerfConfigurations.ts`.

# Adding a new reactive library to the test suite
1. Implement a `ReactiveFramework` wrapper. See e.g. `SolidFramework.ts` or `PreactSignalFramework.ts`
2. List your framework wrapper as a `FrameworkInfo` in `PerfConfigurations.ts`
