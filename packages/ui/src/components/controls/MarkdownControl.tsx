import { useTheme } from "@/providers";
import type { TypographyControl } from "@imminently/interview-sdk";
// import Markdown from "react-markdown";
import { Streamdown } from 'streamdown';

export interface TypographyControlProps {
  control: TypographyControl;
}

// NOTE name does not have Control included, as its just ready only text
// WIP testing out markdown support
export const MarkdownControl = ({ control }: TypographyControlProps) => {
  return (
    <Streamdown>
      {control.text}
    </Streamdown>
  );
};

// demo content, put it in a control and give it class "md"
/**

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

**Bold text** or __also bold__
*Italic text* or _also italic_
***Bold and italic***

~~Crossed out text~~

Use the `Streamdown` component in your app.

[Visit our website](https://streamdown.ai)

- First item
- Second item
  - Nested item
  - Another nested item
- Third item

1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

- [x] #739
- [ ] https://github.com/octo-org/octo-repo/issues/740
- [ ] Add delight to the experience when all tasks are complete :tada:

---

> "The development of full artificial intelligence could spell the end of the human race."
> — Stephen Hawking

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```

![Placeholder](https://placehold.co/600x400)

| Feature | Supported |
|---------|-----------|
| Markdown | ✓ |
| Streaming | ✓ |
| Math | ✓ |

 */
