# Pomodoro Art

A friendly Pomodoro timer with a twist: while you focus, a real painting slowly comes into view.

## What the app is

- It is a **Pomodoro timer**, a countdown that helps you focus for a set time.
- A painting from the **Metropolitan Museum of Art** (the Met) in New York is picked for you.
- The painting starts **blurred**. As the time counts down, it gets **clearer** a little at a time.
- When the timer reaches **00:00**, the painting is fully sharp.

**Live link:** [add live link here]

## How it works

- **Start**: begins the countdown. The timer starts at 25:00.
- **Pause**: stops the countdown. The painting stays as blurred as it was.
- **Resume**: carries on from where you paused.
- **Reset**: goes back to 25:00 and a strongly blurred painting. It keeps the **same** painting.
- **Setting the timer length**:
  - Use the **Minutes** and **Seconds** boxes before you press Start.
  - The shortest time is 00:30 and the longest is 120:00.
  - If you type something that doesn't work, you get a short message and the last good time is kept.
  - You can't change the length once the timer has started.
- **A gold line** around the painting slowly fills up as time passes.
- **At 00:00**:
  - The painting is fully sharp.
  - You see the painting's **name, artist and year**.
  - You see a link to read about it on the Met's website. It opens in a new tab.
  - The **Restart session** button picks a **new** painting and takes you back to 25:00.

Good to know: the timer stays correct even if you switch to another browser tab and come back.

## Where the paintings come from

- Paintings and their details come from the Met's free **Collection API** (an API is a way for one website to ask another for information).
- **No API key is needed.** The app just asks the Met directly.
- The app only uses paintings that are **public domain** (free for everyone to use) and have a picture.
- The name, artist, year and link are taken from the Met's own record for that painting. Nothing is made up. If the Met doesn't list an artist or year, the app shows "Unknown".

## What happens when something goes wrong

- If a painting has no picture, or isn't a public domain painting, the app quietly tries another one (up to 5 times).
- If the Met doesn't answer within about 10 seconds, or gives an error, the app stops trying.
- In both cases you see this friendly message where the painting would be:
  *"We couldn't load a painting right now. You can still use the timer. Refresh the page to try again."*
- **The timer and buttons still work.** At 00:00 you just won't see a painting or its details.
- To try again, refresh the page, or press **Restart session** after the timer ends.

## What's in this project

- `index.html`: the page itself.
- `style.css`: how the page looks.
- `script.js`: how the page works (the timer, the blur and getting a painting).
- `mockups`: early design sketches, kept for reference.

It is built with plain HTML, CSS and JavaScript. There is nothing to install.

## Credits

- Paintings and details: the [Metropolitan Museum of Art](https://www.metmuseum.org/), through its open Collection API.
- Built by [your name].
