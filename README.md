# MCP Chart Viewer

A provider-agnostic chart application that turns natural-language questions into [Chart.js](https://www.chartjs.org/) graphs, using any [MCP](https://modelcontextprotocol.io) servers you connect as data sources. It ships with the [Wolfram Alpha](https://wolframalpha.com) MCP server seeded by default, but any MCP server (remote or local) can be plugged in per tab.

It makes use of the following under the hood to bring it to life:

- Bun
- Vue.js
- Pinia (data state management)
- Vuetify
- Langchain
- Nuxt
- Vite
- Zod

# Setup

1. Ensure you have an openrouter api key! If not, grab one over at https://openrouter.ai
2. Install everything via bun:

```bash
# Install...
bun i

# Then run!
bun --bun dev

# < Now Listening to http://localhost:3000 ... >
```

3. navigate to the page, and click on the gear (top right corner) to add your openrouter API key

![Api Settings](./gh-readme-assets/api-settings.png)

4. Click save, then you're done!
5. (Optional) configure MCP servers from that previous menu - wolfram is available by default, but remote servers and local servers are supported

> If you don't want to use openrouter, there are static examples of charts by inserting `!mock` in the prompt box!

# Protips for running

## Be specific with your prompts

What's helped me is to prompt what kind of chart you'd like, optionally colors, and the types of values the chart needs needs to plot down (e.g "value should be USD")

It'll do it's best, but makes mistakes regardless!

## Test the prompt box without actually triggering the LLM

Simply inserting `!mock` in the box allows to test server calls without calling an LLM or using an API key.

## Edit and share your finished charts

By using the "copy" feature on a finished chart, it's possible to paste that into either a code editor, or the prompt box itself.

By doing this, you can add values, change existing ones, or even change out the color of the chart itself.

**Sharing** your charts can be done the same way! Copy the chart result, then exchange it on a channel such as slack through the snippets feature. (Other platforms support the markdown/json combo, such as atlassian confluence and other products)

## MCP specific instructions

The Subagent may attempt to prompt a tool similar to how it would through a web search.

Some server tools don't work that way, such as `wikipedia` - it will provide articles through `get_article`, therefore requiring a name. The tool instructions can hcange this behavior. For example:

```
The get_article tool returns a wikipedia page of the exact name. It doesn't work like a search engine! However it can be used to retrieve metadata about the subject being talked about.
```

# Great MCP servers to try out

- [wolfram-alpha](https://www.wolfram.com/artificial-intelligence/mcp/cloud/wolfram-mcp-cloud/) (built in!)
- [wikipedia](https://github.com/Rudra-ravi/wikipedia-mcp)
- [openrouter](https://openrouter.ai/docs/guides/overview/mcp-server)

For openrouter specifically, while the directions say it uses oauth, it's also secretly possible to just supply an API key:

```json
{
  "Authorization": "Bearer sk-or-v1-78ddb2e44c224f0eb7a7c3cf660cfe60b5bf7cc75d1744afbee3fa8d0ab0b5b"
}
```

# Dream upgrades

Possible routes that could be taken if this was worked on more:

- [x] sub-agent delegation on queries
- [x] localStorage support to store queries, chart data and history
- [x] "tools called" section in the metadata
- [x] custom theming
- [x] Delete previous queries
- [x] Copy & paste chart data from other sessions
- [x] plugins: gather data from other MCP sources & tools
- [ ] data verification (is this a correct shape, even though the model tried?)

# Starter queries

```
compare the amount of protein in: Steak, chicken, turkey, polluck (please make a bar chart)
```

```
calories of apple, orange, strawberry, grape, dragon fruit (make it a donut graph)
```

```
How expensive is gas between Toronto and Honolulu Hawaii?
```

```
What is the value of gold, versus the value of bitcoin? (provide actual value in USD and create a pie-chart)
```

```
use "name {name}" to query the popularity of the following names: Zach, Felix, Sally, George, Smith, Josh, Chris. Make it a pie chart. Datapoints should be "rank"
```

```
box office proffit of toy story 1 versus toy story 2
```

```
(skip data gathering) Make me a pie chart that has the following values: 3, 50, 25, 22
```

```
A bubble graph of the birth, death, and presidency of the two presidents: george washington, abraham lincoln
```

```
"polar area chart" for the value of gold, silver, nickle, copper, diamond. Value should be worth in USD. Colors of the bars should represent the color of each item.
```

```
pie chart that has a value of 75% labeled pacman, and a dark-blue remainder with the label "ghost"
```

```
Display the entire nutrition facts for "chicken". It must be a bar chart, should have color. Measurement should be % of daily intake
```

# Known Bugs

- ESLint for typescript 7.0.2 is not supported: https://github.com/typescript-eslint/typescript-eslint/issues/12518 - they plan on doing support for 7.1, as such its not in this project until then
- Importing types is bugged in 7.0.2 and CLI/Server rendering. `.vue` files will have interfaces in-file, which is alright. The rest of the imports nuxt is doing inferrence on.
  - Strangely enough, zod exports somehow escape this quirk

# Gallery

![Currencies](./gh-readme-assets/currencies.png)
![Fruits](./gh-readme-assets/fruits.png)
![Names](./gh-readme-assets/names.png)
![Protein](./gh-readme-assets/protein.png)
![Chicken](./gh-readme-assets/chicken.png)
![Weather](./gh-readme-assets/weather.png)
![Color](./gh-readme-assets/color.png)
![Fish](./gh-readme-assets/fish.png)
![Openrouter](./gh-readme-assets/openrouter.png)
![Openrouter 2](./gh-readme-assets/openrouter2.png)
![Tab Config](./gh-readme-assets/tab-config.png)
![Openrouter Config](./gh-readme-assets/openrouter-config.png)
