// import { square, circle } from '../../src/components.ts';
import createView, { View, ActionGenerator, wait } from "../../src/index";
import TUtil from "../../src/TUtil";
import { Rectangle, Ellipse } from "../../src/components";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas is undefined');
const view = createView(canvas);
view.onBeforeFrame = () => {
	view.canvas.width = view.canvas.clientWidth;
	view.canvas.height = view.canvas.clientHeight;
}

view.play(function* animation(view: View): ActionGenerator {
	const box = new Rectangle({width: 40, height: 40, fill: "#ffffff", stroke: "transparent"});
	const child = new Ellipse({width: 40, height: 40, fill: "#ff0000", stroke: "transparent", x: 20, y: 20});
	// const ball = circle({ x: 10, y: 20 });
	box.addChild(child);
	view.add(box);
	// view.add(ball);
	// yield* box.moveBy(100, 100, 1500);
	yield* TUtil.parallel([box.x(25, 1000), box.width(80, 1000)]);
	yield* wait(1000);
	yield* TUtil.parallel([box.y(25, 1000), box.height(80, 1000)]);
	// yield* parallel([box.moveBy(10, 10, 100)]);
});
