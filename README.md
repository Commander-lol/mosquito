# Mosquito

(( This is where the cool picture goes ))

Dependency Injection that doesn't need any fanagle or weirdness. Simply put: Define what the container should provide when a constructor declares a certain parameter, and...well, that's it really.

Supports Node 6+ and LTS

## Usage

Using mosquito directy is fairly simple, but will likely be abstracted away by some framework you're using. There is one component that you'll commonly use, and one that might get used occasionally (or not at all in many cases).

The basic pattern is delcaring your dependancies as parameters to the constructor of a class. The Container will then provide those dependancies via resolutions when the class is constructed. 

```js
const { Container, ServiceProvider } = require('mosquito')
const provider = new ServiceProvider

class MyRepoImplementation {
	constructor(ThatStringINeed) {
		this.myStringThing = ThatStringINeed
	}
}

provider.register((app) => {
	app.when('MyRepo').singleton(MyRepoImplementation)
	app.when('ThatStringINeed').object('This is that string')
})

// You normally wont use `Container#make`, but it's good for examples
const repo = Container.make('MyRepoImplementation')
console.log(repo.myStringThing) // Outputs: "This is that string"
```

### Service Provider

The Service Provider is where you'll be doing all of the work. It's the easiest way to register resolutions with the container, through a series of helper functions. To start, you'll need to import the ServiceProvider object, and create a new one (don't worry, no parameters):

```js
const { ServiceProvider } = require('mosquito')
const provider = new ServiceProvider
```

This provides the contract for easily registering dependancies with the container. To kick start the process, you'll need to call the `#register` method, and provide it with a function that accepts a `ProviderBuilder`

```js
provider.register((app) => {
```

The provider builder itself only exposes one method, `with`, which defines the name of the dependancy. It then returns a set of helpers, each of which provides a different type of object when the dependancy is resolved.

helper | takes | provides
-------|-------|-----
`#singleton` | A class | The same instance of that class to all dependees
`#instanceOf` | A class | A new instance of the class when a dependee is instantiated
`#object` | Any object | The passed in object
`#copyOf` | Any object | A copy of the passed in object, created with `lodash.deepclone`
`#resultOf` | A function | The return value of invoking the given function, which is invoked when a dependee is instantiated
