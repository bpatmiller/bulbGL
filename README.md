## Run the program here: [bulbGL](http://bpatmiller.github.io/bulbGL)

### What is this?

The [Mandelbulb](https://en.wikipedia.org/wiki/Mandelbulb) is a 3 dimensional fractal similar to the famous 2 dimensional Mandelbrot set. It is the set of all 3d numbers that remain stable when raised to the nth power and added to themselves. This animation goes from the 2nd power to the 14th power.

### Specifics

These images were made a technique called raymarching with distance estimation. Each pixel "marches" into the distance until it becomes sufficiently close to a boundary. At this point, the pixel stops marching and is shaded based on how many steps it took to reach the boundary. Read more about this process [here](http://9bitscience.blogspot.com/2013/07/raymarching-distance-fields_14.html).
In order to play or pause the animation, check the "animate" box in the menu in the top right. In order to increase or decrease the detail, adjust the "minimumStepDistance" slider.

### Controls

Orbit around the Mandelbulb using the arrow keys.

Move forwards and backwards using "w" and "s".

Look around by clicking and dragging.

Use the gui on the top right to play/pause the animation or adjust render quality
