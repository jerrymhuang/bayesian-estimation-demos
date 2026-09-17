'use strict';
// Only author-supplied LaTeX is rendered; no user input or remote assets.
for (const element of document.querySelectorAll('.math')) {
  const source = element.textContent;
  try {
    katex.render(source, element, {
      displayMode: !element.classList.contains('inline'),
      throwOnError: true,
      trust: false,
      strict: 'error',
      output: 'htmlAndMathml'
    });
  } catch (error) {
    element.textContent = source;
    element.classList.add('math-error');
    console.error('Unable to render derivation equation:', error);
  }
}
