import { EmptyError, Subject, tap } from "rxjs";

import { anyComplete, on, ready } from "./rx";

describe("anyComplete", () => {
  it("emits true when its input completes", () => {
    const input$ = new Subject<void>();

    const emissions: boolean[] = [];
    anyComplete(input$).subscribe((e) => emissions.push(e));
    input$.complete();

    expect(emissions).toEqual([true]);
  });

  it("completes when its input is already complete", () => {
    const input = new Subject<void>();
    input.complete();

    let completed = false;
    anyComplete(input).subscribe({ complete: () => (completed = true) });

    expect(completed).toBe(true);
  });

  it("completes when any input completes", () => {
    const input$ = new Subject<void>();
    const completing$ = new Subject<void>();

    let completed = false;
    anyComplete([input$, completing$]).subscribe({ complete: () => (completed = true) });
    completing$.complete();

    expect(completed).toBe(true);
  });

  it("ignores emissions", () => {
    const input$ = new Subject<number>();

    const emissions: boolean[] = [];
    anyComplete(input$).subscribe((e) => emissions.push(e));
    input$.next(1);
    input$.next(2);
    input$.complete();

    expect(emissions).toEqual([true]);
  });

  it("forwards errors", () => {
    const input$ = new Subject<void>();
    const expected = { some: "error" };

    let error = null;
    anyComplete(input$).subscribe({ error: (e: unknown) => (error = e) });
    input$.error(expected);

    expect(error).toEqual(expected);
  });
});

describe("ready", () => {
  it("connects when subscribed", () => {
    const watch$ = new Subject<void>();
    let connected = false;
    const source$ = new Subject<number>().pipe(tap({ subscribe: () => (connected = true) }));

    // precondition: ready$ should be cold
    const ready$ = source$.pipe(ready(watch$));
    expect(connected).toBe(false);

    ready$.subscribe();

    expect(connected).toBe(true);
  });

  it("suppresses source emissions until its watch emits", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const ready$ = source$.pipe(ready(watch$));
    const results: number[] = [];
    ready$.subscribe((n) => results.push(n));

    // precondition: no emissions
    source$.next(1);
    expect(results).toEqual([]);

    watch$.next();

    expect(results).toEqual([1]);
  });

  it("suppresses source emissions until all watches emit", () => {
    const watchA$ = new Subject<void>();
    const watchB$ = new Subject<void>();
    const source$ = new Subject<number>();
    const ready$ = source$.pipe(ready([watchA$, watchB$]));
    const results: number[] = [];
    ready$.subscribe((n) => results.push(n));

    // preconditions: no emissions
    source$.next(1);
    expect(results).toEqual([]);
    watchA$.next();
    expect(results).toEqual([]);

    watchB$.next();

    expect(results).toEqual([1]);
  });

  it("emits the last source emission when its watch emits", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const ready$ = source$.pipe(ready(watch$));
    const results: number[] = [];
    ready$.subscribe((n) => results.push(n));

    // precondition: no emissions
    source$.next(1);
    expect(results).toEqual([]);

    source$.next(2);
    watch$.next();

    expect(results).toEqual([2]);
  });

  it("emits all source emissions after its watch emits", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const ready$ = source$.pipe(ready(watch$));
    const results: number[] = [];
    ready$.subscribe((n) => results.push(n));

    watch$.next();
    source$.next(1);
    source$.next(2);

    expect(results).toEqual([1, 2]);
  });

  it("ignores repeated watch emissions", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const ready$ = source$.pipe(ready(watch$));
    const results: number[] = [];
    ready$.subscribe((n) => results.push(n));

    watch$.next();
    source$.next(1);
    watch$.next();
    source$.next(2);
    watch$.next();

    expect(results).toEqual([1, 2]);
  });

  it("completes when its source completes", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const ready$ = source$.pipe(ready(watch$));
    let completed = false;
    ready$.subscribe({ complete: () => (completed = true) });

    source$.complete();

    expect(completed).toBeTruthy();
  });

  it("errors when its source errors", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const ready$ = source$.pipe(ready(watch$));
    const expected = { some: "error" };
    let error = null;
    ready$.subscribe({ error: (e: unknown) => (error = e) });

    source$.error(expected);

    expect(error).toEqual(expected);
  });

  it("errors when its watch errors", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const ready$ = source$.pipe(ready(watch$));
    const expected = { some: "error" };
    let error = null;
    ready$.subscribe({ error: (e: unknown) => (error = e) });

    watch$.error(expected);

    expect(error).toEqual(expected);
  });

  it("errors when its watch completes before emitting", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const ready$ = source$.pipe(ready(watch$));
    let error = null;
    ready$.subscribe({ error: (e: unknown) => (error = e) });

    watch$.complete();

    expect(error).toBeInstanceOf(EmptyError);
  });
});

describe("on", () => {
  it("connects when subscribed", () => {
    const watch$ = new Subject<void>();
    let connected = false;
    const source$ = new Subject<number>().pipe(tap({ subscribe: () => (connected = true) }));

    // precondition: on$ should be cold
    const on$ = source$.pipe(on(watch$));
    expect(connected).toBeFalsy();

    on$.subscribe();

    expect(connected).toBeTruthy();
  });

  it("suppresses source emissions until `on` emits", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const results: number[] = [];
    source$.pipe(on(watch$)).subscribe((n) => results.push(n));

    // precondition: on$ should be cold
    source$.next(1);
    expect(results).toEqual([]);

    watch$.next();

    expect(results).toEqual([1]);
  });

  it("repeats source emissions when `on` emits", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const results: number[] = [];
    source$.pipe(on(watch$)).subscribe((n) => results.push(n));
    source$.next(1);

    watch$.next();
    watch$.next();

    expect(results).toEqual([1, 1]);
  });

  it("updates source emissions when `on` emits", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const results: number[] = [];
    source$.pipe(on(watch$)).subscribe((n) => results.push(n));

    source$.next(1);
    watch$.next();
    source$.next(2);
    watch$.next();

    expect(results).toEqual([1, 2]);
  });

  it("emits a value when `on` emits before the source is ready", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const results: number[] = [];
    source$.pipe(on(watch$)).subscribe((n) => results.push(n));

    watch$.next();
    source$.next(1);

    expect(results).toEqual([1]);
  });

  it("ignores repeated `on` emissions before the source is ready", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const results: number[] = [];
    source$.pipe(on(watch$)).subscribe((n) => results.push(n));

    watch$.next();
    watch$.next();
    source$.next(1);

    expect(results).toEqual([1]);
  });

  it("emits only the latest source emission when `on` emits", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const results: number[] = [];
    source$.pipe(on(watch$)).subscribe((n) => results.push(n));
    source$.next(1);

    watch$.next();

    source$.next(2);
    source$.next(3);
    watch$.next();

    expect(results).toEqual([1, 3]);
  });

  it("completes when its source completes", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    let complete: boolean = false;
    source$.pipe(on(watch$)).subscribe({ complete: () => (complete = true) });

    source$.complete();

    expect(complete).toBeTruthy();
  });

  it("completes when its watch completes", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    let complete: boolean = false;
    source$.pipe(on(watch$)).subscribe({ complete: () => (complete = true) });

    watch$.complete();

    expect(complete).toBeTruthy();
  });

  it("errors when its source errors", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const expected = { some: "error" };
    let error = null;
    source$.pipe(on(watch$)).subscribe({ error: (e: unknown) => (error = e) });

    source$.error(expected);

    expect(error).toEqual(expected);
  });

  it("errors when its watch errors", () => {
    const watch$ = new Subject<void>();
    const source$ = new Subject<number>();
    const expected = { some: "error" };
    let error = null;
    source$.pipe(on(watch$)).subscribe({ error: (e: unknown) => (error = e) });

    watch$.error(expected);

    expect(error).toEqual(expected);
  });
});