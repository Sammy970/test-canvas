// @ts-check

import { Canvas, GlobalFonts, loadImage } from "@napi-rs/canvas";

export default async function generateImage(req, res) {
  const { fs, cl, w } = req.query;

  const i = "Hello";
  const lx = undefined;
  const ly = undefined;
  const lfo = "top_left";

  GlobalFonts.registerFromPath("../Roboto-Italic.ttf", "Roboto");

  console.log(GlobalFonts.families);

  // const processedImageBuffer = await image.toBuffer();

  const assetUrl = `https://utfs.io/f/31898534-55b7-4700-a04a-e38956fac843-2487m.webp`;

  const imageLoaded = await loadImage(assetUrl);

  // Create a canvas with the same dimensions as the image
  // canvas = createCanvas(imageLoaded.width, imageLoaded.height);
  // const ctx = canvas.getContext("2d");

  let canvas = new Canvas(imageLoaded.width, imageLoaded.height);
  const ctx = canvas.getContext("2d");

  let text;
  if (i.includes("%20")) {
    // i = Hello%20World
    text = i.replace(/%20/g, " ");
  } else {
    text = i;
  }

  console.log("text", text);

  // Draw the image onto the canvas
  ctx.drawImage(imageLoaded, 0, 0);

  // Set the font and color for the text
  ctx.font = "120px Roboto"; // Font size and family
  ctx.fillStyle = cl ? cl : "white"; // Text color

  // Function to wrap text
  const wrapText = (context, text, maxWidth) => {
    if (!maxWidth) {
      return [text];
    }

    const words = text.split(" ");
    let line = "";
    const lines = [];

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const testWidth = context.measureText(testLine).width;
      if (testWidth > maxWidth && i > 0) {
        lines.push(line.trim());
        line = words[i] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    return lines;
  };

  const lines = wrapText(ctx, text, w);

  console.log("lines", lines);

  // Measure the text size
  const textWidth = Math.max(
    ...lines.map((line) => ctx.measureText(line).width)
  );
  const textHeight = fs ? parseInt(fs, 10) : 40; // Adjust based on font size
  const totalTextHeight = lines.length * textHeight;

  let posX, posY;

  if (lfo) {
    // Calculate position based on lfo (layout format option)
    switch (lfo) {
      case "top":
        posX = (imageLoaded.width - textWidth) / 2;
        posY = textHeight;
        break;
      case "top_left":
        posX = 10;
        posY = textHeight + 10;
        break;
      case "top_right":
        posX = imageLoaded.width - textWidth;
        posY = textHeight + 10;
        break;
      case "middle":
        posX = (imageLoaded.width - textWidth) / 2;
        posY = (imageLoaded.height - totalTextHeight) / 2 + textHeight; // Center vertically based on line count
        break;
      case "middle_left":
        posX = 10;
        posY = (imageLoaded.height - totalTextHeight) / 2 + textHeight; // Center vertically based on line count
        break;
      case "middle_right":
        posX = imageLoaded.width - textWidth;
        posY = (imageLoaded.height - totalTextHeight) / 2 + textHeight; // Center vertically based on line count
        break;
      case "bottom":
        posX = (imageLoaded.width - textWidth) / 2;
        posY = imageLoaded.height - totalTextHeight + textHeight;
        break;
      case "bottom_left":
        posX = 10;
        posY = imageLoaded.height - totalTextHeight + textHeight - 15;
        break;
      case "bottom_right":
        posX = imageLoaded.width - textWidth - 10;
        posY = imageLoaded.height - totalTextHeight + textHeight - 15;
        break;
      default:
        // Default to middle if lfo is not recognized
        posX = (imageLoaded.width - textWidth) / 2;
        posY = (imageLoaded.height - totalTextHeight) / 2 + textHeight; // Center vertically based on line count
    }
  } else {
    let lxFromUser = lx || 0; // X coordinate
    let lyFromUser = ly || 0; // Y coordinate

    // Calculate maximum X and Y coordinates
    const maxX = imageLoaded.width - textWidth;
    const maxY = imageLoaded.height - totalTextHeight;

    if (lx === undefined && ly === undefined) {
      // Center the text horizontally and vertically
      posX = (imageLoaded.width - textWidth) / 2;
      posY = (imageLoaded.height - lines.length * textHeight) / 2 + textHeight; // Center vertically based on line count
    } else {
      // Handle lxFromUser
      const isNegativeX =
        typeof lxFromUser === "string" && lxFromUser.startsWith("N");
      posX = isNegativeX
        ? imageLoaded.width - parseInt(lxFromUser.slice(1), 10) - textWidth
        : parseInt(lxFromUser, 10);

      // Handle lyFromUser
      const isNegativeY =
        typeof lyFromUser === "string" && lyFromUser.startsWith("N");
      posY = isNegativeY
        ? imageLoaded.height -
          parseInt(lyFromUser.slice(1), 10) -
          totalTextHeight
        : parseInt(lyFromUser, 10);
    }

    // Adjust coordinates to ensure text fits within image boundaries
    posX = Math.max(0, Math.min(posX, maxX));
    posY = Math.max(textHeight, Math.min(posY + textHeight, maxY + textHeight));
  }

  // Draw the text on the canvas
  // ctx.fillText(text, adjustedX, adjustedY);

  // Draw each line of text on the canvas
  lines.forEach((line, index) => {
    ctx.fillText(line, posX, posY + index * textHeight); // Adjust for line height
  });

  // ctx.fillStyle = "red";
  // ctx.fillRect(posX - 5, posY - 5, 10, 10); // small red square at the text start position

  // ctx.fillStyle = "black"; // Ensure text is visible
  // ctx.fillText("Hello", 50, 50); // Test with hardcoded text

  const buffer = canvas.toBuffer("image/png");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Disposition", "inline");
  res.send(buffer);
}
