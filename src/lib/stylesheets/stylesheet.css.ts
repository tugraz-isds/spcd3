import { createTheme, style } from '@vanilla-extract/css';

export const [themeClass, vars] = createTheme({
    color: {
      brand: 'orange'
    }
  });

export const exampleStyle = style({
    stroke: vars.color.brand,
    opacity: 1
});