export const auth_otp_template = (otp: number) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      rel="stylesheet"
    />

    <style>
      *,
      body,
      html {
        padding: 0;
        margin: 0;
        box-sizing: border-box;
      }

      body {
        background-color: rgb(207, 205, 205);
        width: 100vw;
        height: 100vh;
      }
      .wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
      }

      .container {
        background-color: #fff;
        padding: 32px 24px;
        border-radius: 24px;
        border: 1px solid rgb(190, 188, 188);
        margin: 48px;
      }

      @media screen and (min-width: 600px) {
        .container {
          width: 600px;
          height: 400px;
        }
      }
    </style>
  </head>

  <body>
    <div class="wrapper">
      <div class="container">
        <img
          src="https://dzb6ozotvt.ufs.sh/f/NlOYKmasUjYHlfPqgL1oyxTnEN2FIeAOadqgUjsM7SukQG9V"
          alt="lock"
          width="120px"
          height="120px"
          style="display: block; margin: auto"
        />

        <h3
          style="
            font-family: Poppins;
            font-weight: 700;
            text-align: center;
            padding-top: 24px;
          "
        >
          Verify your sing-up
        </h3>
        <p
          style="
            font-family: Poppins;
            font-weight: 400;
            text-align: center;
            padding-top: 16px;
            line-height: 24px;
          "
        >
          we have received a sign-up attempt with the following code. Please
          enter it in the browser window where you.Started signing up.
        </p>

        <div
          style="
            background-color: rgb(207, 205, 205);
            width: 100%;
            height: 64px;
            margin-top: 32px;
            border-radius: 16px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
          "
        >
          <h2
            style="font-family: Poppins; font-weight: 700; text-align: center"
          >
           ${otp}
          </h2>
        </div>
      </div>
    </div>
  </body>
</html>
`;
