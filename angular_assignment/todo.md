# Interview Preparation Guide: Global NgRx Store (Actions, Reducers, Selectors, Effects) 🚀

Interviewer ko impress karne ke liye humne application ko **Traditional Enterprise Global NgRx Store (`@ngrx/store` + `@ngrx/effects`)** mein migrate kiya hai. Yeh architecture bade large-scale enterprise projects mein state management aur testing ke liye industry standard hai.

Niche saare concepts, file structure, aur questions Hinglish mein simple tarike se explain kiye gaye hain taaki aap interview clear kar sakein! 🎯

---

## 1. Project Architecture (Global NgRx Setup)

State management ko clean aur decoupled rakhne ke liye humne isse 5 main parts mein divide kiya hai:

1. **Actions** ([todo.actions.ts](file:///d:/git/codebuster/angular_assignment/src/app/store/todo.actions.ts)):
   * Humare application ke events (jaise `Load Todos`, `Add Todo`, `Update Todo`) ko define karta hai.
   * Yeh pure event descriptions hote hain jo store ko trigger karte hain.
2. **Reducer** ([todo.reducer.ts](file:///d:/git/codebuster/angular_assignment/src/app/store/todo.reducer.ts)):
   * Pure functions hote hain jo action ke load ke basis par current state ko **immutably** update karke new state snapshot return karte hain.
3. **Selectors** ([todo.selectors.ts](file:///d:/git/codebuster/angular_assignment/src/app/store/todo.selectors.ts)):
   * State se specifically required data slices fetch karne ke liye queries hain (jaise filtered todos ya counts).
   * Yeh lazy aur memorized (`createSelector`) hote hain taaki performance optimum rahe.
4. **Effects** ([todo.effects.ts](file:///d:/git/codebuster/angular_assignment/src/app/store/todo.effects.ts)):
   * Side-effects ko handle karte hain (jaise local storage se data load karna, ya state update hone par auto-save karna).
   * Yeh dynamic data streams (RxJS) use karte hain.
5. **Facade Service** ([todo.service.ts](file:///d:/git/codebuster/angular_assignment/src/app/services/todo.service.ts)):
   * **Bohot Important!** Components directly store se interact nahi karte. Humne `TodoStore` facade service banayi hai jo `store.dispatch()` aur `store.selectSignal()` ko hide karti hai aur components ko clean methods aur standard Angular Signals deti hai.

---

## 2. Deep Dive Into Store Files (Code and Logic)

### Reducer purity maintain kaise kiya?
* **Problem**: Agar reducer ke andar `crypto.randomUUID()` ya `new Date()` call karenge, toh reducer impure ho jayega kyunki har execution par different output aayega.
* **Solution**: Humne `TodoActions.addTodo` action ko pre-generated complete `Todo` object pass kiya. Isse `id` aur `createdAt` service facade level par generate hota hai aur reducer strictly deterministic aur pure rehta hai.

### LocalStorage Syncing via Effects:
Effects ke andar humne checks lgaye hain ki code server par execute ho raha hai ya browser par (`isPlatformBrowser` utility), taaki pre-rendering (SSR) ke time `localStorage is not defined` crash na aaye.
* **`loadTodos$` Effect**: `Load Todos` action aane par storage read karke `Load Todos Success` ya fail hone par `Load Todos Failure` trigger karta hai.
* **`saveTodos$` Effect**: Jab bhi state-changing actions (add, update, delete, toggle) execute hote hain, toh latest state fetch karke localStorage mein silent write karta hai (without dispatching another action: `{ dispatch: false }`).

---

## 3. Top Interview Questions & Mind-Blowing Answers 💡

### Q1: App mein Global NgRx Store kyun use kiya, jabki simple behavior subject ya local store se kaam ho sakta tha?
**Answer**:
* **Enterprise Scaling**: Large applications mein global flow maintain karna, multiple team members ka conflict-free code likhna, aur unidirectional data flow implement karne ke liye Global NgRx standard hai.
* **Debugging**: Humne `@ngrx/store-devtools` connect kiya hai. Isse Chrome/Edge Redux DevTools extension mein state changes ka timeline visualizes ho jata hai aur hum **Time Travel Debugging** kar sakte hain (actions ko undo/redo karke state verify karna).
* **Separation of Concerns**: UI components ka kaam sirf display aur user interaction control karna hai. State changes aur side-effects separate files (reducers/effects) mein isolated hote hain.

### Q2: What is the Facade Pattern in NgRx and why did you use it?
**Answer**:
* **Decoupling**: Agar hum direct components mein `Store` inject karenge, toh future mein change karne par hume saare components ki dependency badalni padegi. Facade Pattern (`TodoStore` service) components ko details expose nahi karti.
* **Signals Integration**: Facade ke andar humne `this.store.selectSignal(selector)` use kiya hai. Isse components ko standard Angular Signal interfaces directly mil jate hain (`store.filteredTodos()`), aur RxJS subscriptions (`async` pipe) manage karne ka boilerplate khatam ho jata hai.
* **Zero Refactoring**: Underneath humne framework badal diya (SignalStore se Global Store), par humare UI components ka code bilkul change nahi karna pada! Yeh Facade pattern ki sabse badi power hai.

### Q3: Reducer pure function kyun hona chahiye aur pure state transition kaise achieve kiya?
**Answer**:
* Reducer pure function isliye hona chahiye taaki debugging, time travel, aur testing predictable ho. Hum object restructuring and spread operators (`...state`, `...todo`) use karke state ka new instance return karte hain bina direct mutation kiye:
  ```typescript
  on(TodoActions.deleteTodo, (state, { id }) => ({
    ...state,
    todos: state.todos.filter((todo) => todo.id !== id)
  }))
  ```

---

## 4. Run and Test in DevTools

1. `npm install --legacy-peer-deps` chalane ke baad `npm start` karein.
2. Browser mein right click karke **Inspect Element** kholin.
3. **Redux DevTools** tab par click karein.
4. Har click, task toggle ya update hone par aapko pure state changes visual discrete cards ki tarah timeline mein dikhenge. Aap actions replay kar sakte hain!
