import { Component, ComponentProps, TweenFunction, TweenType, useTween } from "../tanim";
import TUtil from "../../src/TUtil";

export default class Rectangle extends Component {
	width: TweenFunction<number>;
	height: TweenFunction<number>;
	fill: string;
	stroke: string;
	constructor({
		x = 0,
		y = 0,
		width = 0,
		height = 0,
		fill = "#ffffff",
		stroke = "transparent",
	}: Partial<ComponentProps<Rectangle>>) {
		super();
		this.width = useTween(width, TUtil.lerp);
		this.height = useTween(height, TUtil.lerp);
		this.fill = fill;
		this.stroke = stroke;
		this.x = useTween(x, TUtil.lerp);
		this.y = useTween(y, TUtil.lerp);
	}
	render(ctx: CanvasRenderingContext2D, data: {parentGlobalX: number, parentGlobalY: number}) {
		ctx.fillStyle = this.fill;
		ctx.strokeStyle = this.stroke;
	
		const global = this.globalPosition(data);
	
		ctx.fillRect(global.x, global.y, this.width(), this.height());
		ctx.strokeRect(global.x, global.y, this.width(), this.height());
		super.render(ctx, data);
	}
}