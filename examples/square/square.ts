// import { square, circle } from '../../src/components.ts';
import createView, { View, ActionGenerator, TUtil } from "../../src/index";
import { Rectangle } from "../../src/components/Rectangle.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas is undefined');
const view = createView(canvas);
view.onBeforeFrame = () => {
	view.canvas.width = window.innerWidth;
	view.canvas.height = window.innerHeight;
}

view.play(function* animation(view: View): ActionGenerator {
	const box = new Rectangle({width: 50, height: 50, fill: "#ffffff", stroke: "transparent"});
	const childBox = new Rectangle({width: 50, height: 50, fill: "#ff0000", stroke: "transparent"});
	// const ball = circle({ x: 10, y: 20 });
	box.addChild(childBox);
	view.add(box);
	// view.add(ball);
	// yield* box.moveBy(100, 100, 1500);
	yield* TUtil.parallel([box.x(100, 1500), box.width(160, 1500)]);
	yield* TUtil.parallel([box.y(100, 1500), box.height(90, 1500)]);
	// yield* parallel([box.moveBy(10, 10, 100)]);
});
