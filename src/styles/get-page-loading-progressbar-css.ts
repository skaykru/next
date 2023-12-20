export const getPageLoadingProgressbarCSS = (defaultCSS: string) => `
  ${defaultCSS}
  #nprogress .bar {
    height: 4px;
    background: linear-gradient(to right, #5CB85C, #a3e635, #84cc16, #22c55e, #5CB85C);
    background-size: 500%;
    animation:
      2s linear infinite barprogress,
      0.3s fadein;
  }

  @keyframes barprogress {
    0% {
      background-position: 0% 0;
    }
    to {
      background-position: 125% 0;
    }
  }
`;
