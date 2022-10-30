import {
    TerraDrawCallbacks,
    TerraDrawAdapter,
    TerraDrawModeRegisterConfig,
    TerraDrawAdapterStyling,
    TerraDrawChanges,
    TerraDrawMouseEvent,
    SELECT_PROPERTIES,
    POLYGON_PROPERTIES,
} from "../common";
import { Feature, GeoJsonObject } from "geojson";
import L from "leaflet";
import { limitPrecision } from "../geometry/limit-decimal-precision";

export class TerraDrawLeafletAdapter implements TerraDrawAdapter {
    constructor(config: {
        lib: typeof L;
        map: L.Map;
        coordinatePrecision?: number;
    }) {
        this._lib = config.lib;
        this._map = config.map;
        this._coordinatePrecision =
            typeof config.coordinatePrecision === "number"
                ? config.coordinatePrecision
                : 9;

        this.getMapContainer = () => {
            return this._map.getContainer();
        };

        this.project = (lng: number, lat: number) => {
            const { x, y } = this._map.latLngToContainerPoint({ lng, lat });
            return { x, y };
        };

        this.unproject = (x: number, y: number) => {
            const { lng, lat } = this._map.containerPointToLatLng({
                x,
                y,
            } as L.PointExpression);
            return { lng, lat };
        };

        this.setCursor = (cursor) => {
            if (cursor === "unset") {
                this.getMapContainer().style.removeProperty("cursor");
            } else {
                this.getMapContainer().style.cursor = cursor;
            }
        };
    }

    private _heldKeys: Set<string> = new Set();
    private _lib: typeof L;
    private _coordinatePrecision: number;
    private _map: L.Map;
    private _onMouseMoveListener: ((ev: any) => void) | undefined;
    private _onClickListener: ((ev: any) => void) | undefined;
    private _onKeyUpListener: ((ev: any) => void) | undefined;
    private _onKeyDownListener: ((ev: any) => void) | undefined;

    private _onDragStartListener: ((event: MouseEvent) => void) | undefined;
    private _onDragListener: ((event: MouseEvent) => void) | undefined;
    private _onDragEndListener: ((event: MouseEvent) => void) | undefined;
    private _layer: L.Layer | undefined;
    private _closingPointPaneZIndexStyleSheet: HTMLStyleElement | undefined;
    private _closingPointPane = "closingPointPane";
    private _midPointPaneZIndexStyleSheet: HTMLStyleElement | undefined;
    private _midPointPane = "midPointPane";
    private _selectionPaneZIndexStyleSheet: HTMLStyleElement | undefined;
    private _selectedPane = "selectedPane";
    public project: TerraDrawModeRegisterConfig["project"];
    public unproject: TerraDrawModeRegisterConfig["unproject"];
    public setCursor: TerraDrawModeRegisterConfig["setCursor"];

    public getMapContainer: () => HTMLElement;

    private createPaneStyleSheet(pane: string, zIndex: number) {
        const style = document.createElement("style");
        style.type = "text/css";
        style.innerHTML = `.leaflet-${pane} {z-index: ${zIndex};}`;
        document.getElementsByTagName("head")[0].appendChild(style);
        this._map.createPane(pane);
        return style;
    }

    register(callbacks: TerraDrawCallbacks) {
        if (!this._selectionPaneZIndexStyleSheet) {
            this._selectionPaneZIndexStyleSheet = this.createPaneStyleSheet(
                this._selectedPane,
                10
            );
        }

        if (!this._midPointPaneZIndexStyleSheet) {
            this._midPointPaneZIndexStyleSheet = this.createPaneStyleSheet(
                this._midPointPane,
                20
            );
        }

        if (!this._closingPointPaneZIndexStyleSheet) {
            this._closingPointPaneZIndexStyleSheet = this.createPaneStyleSheet(
                this._closingPointPane,
                30
            );
        }

        const container = this.getMapContainer();

        let dragState:
            | "not-dragging"
            | "pre-dragging"
            | "dragging"
            | "after-dragging" = "not-dragging";

        this._onClickListener = (event: L.LeafletMouseEvent) => {
            if (dragState === "not-dragging" || dragState === "pre-dragging") {
                callbacks.onClick({
                    lng: limitPrecision(event.latlng.lng, this._coordinatePrecision),
                    lat: limitPrecision(event.latlng.lat, this._coordinatePrecision),
                    containerX:
                        event.originalEvent.clientX - this.getMapContainer().offsetLeft,
                    containerY:
                        event.originalEvent.clientY - this.getMapContainer().offsetTop,
                    button: event.originalEvent.button === 0 ? "left" : "right",
                    heldKeys: [...this._heldKeys],
                });
            }
        };

        // We can't use 'click' here because it triggers
        // after drag end in Leaflet for some reason
        this._map.on("mouseup", this._onClickListener);
        this._map.on("contextmenu", this._onClickListener);

        this._onMouseMoveListener = (event: L.LeafletMouseEvent) => {
            event.originalEvent.preventDefault();

            callbacks.onMouseMove({
                lng: limitPrecision(event.latlng.lng, this._coordinatePrecision),
                lat: limitPrecision(event.latlng.lat, this._coordinatePrecision),
                containerX:
                    event.originalEvent.clientX - this.getMapContainer().offsetLeft,
                containerY:
                    event.originalEvent.clientY - this.getMapContainer().offsetTop,
                button: event.originalEvent.button === 0 ? "left" : "right",
                heldKeys: [...this._heldKeys],
            });
        };
        this._map.on("mousemove", this._onMouseMoveListener);

        this._onDragStartListener = (event) => {
            dragState = "pre-dragging";
        };
        container.addEventListener("pointerdown", this._onDragStartListener);

        this._onDragListener = (event) => {
            const point = {
                x: event.clientX - container.offsetLeft,
                y: event.clientY - container.offsetTop,
            } as L.Point;

            const { lng, lat } = this._map.containerPointToLatLng(point);

            const drawEvent: TerraDrawMouseEvent = {
                lng: limitPrecision(lng, this._coordinatePrecision),
                lat: limitPrecision(lat, this._coordinatePrecision),
                containerX: event.clientX - container.offsetLeft,
                containerY: event.clientY - container.offsetTop,
                button: event.button === 0 ? "left" : "right",
                heldKeys: [...this._heldKeys],
            };

            if (dragState === "pre-dragging") {
                dragState = "dragging";

                callbacks.onDragStart(drawEvent, (enabled) => {
                    if (enabled) {
                        this._map.dragging.enable();
                    } else {
                        this._map.dragging.disable();
                    }
                });
            } else if (dragState === "dragging") {
                callbacks.onDrag(drawEvent);
            }
        };

        container.addEventListener("pointermove", this._onDragListener);

        this._onDragEndListener = (event) => {
            event.preventDefault();

            if (dragState === "dragging") {
                const point = {
                    x: event.clientX - container.offsetLeft,
                    y: event.clientY - container.offsetTop,
                } as L.Point;

                const { lng, lat } = this._map.containerPointToLatLng(point);

                callbacks.onDragEnd(
                    {
                        lng: limitPrecision(lng, this._coordinatePrecision),
                        lat: limitPrecision(lat, this._coordinatePrecision),
                        containerX: event.clientX - container.offsetLeft,
                        containerY: event.clientY - container.offsetTop,
                        button: event.button === 0 ? "left" : "right",
                        heldKeys: [...this._heldKeys],
                    },
                    (enabled) => {
                        if (enabled) {
                            this._map.dragging.enable();
                        } else {
                            this._map.dragging.disable();
                        }
                    }
                );

                // We want to avoid triggering an click
                // event after dragging
                dragState = "after-dragging";
                this._map.dragging.enable();
                return;
            }

            dragState = "not-dragging";
            this._map.dragging.enable();
        };

        container.addEventListener("pointerup", this._onDragEndListener);

        // map has no keypress event, so we add one to the canvas itself
        this._onKeyUpListener = (event: KeyboardEvent) => {
            event.preventDefault();

            this._heldKeys.delete(event.key);

            callbacks.onKeyUp({
                key: event.key,
            });
        };
        container.addEventListener("keyup", this._onKeyUpListener);

        this._onKeyDownListener = (event: KeyboardEvent) => {
            event.preventDefault();

            this._heldKeys.add(event.key);

            callbacks.onKeyDown({
                key: event.key,
            });
        };
        container.addEventListener("keydown", this._onKeyDownListener);
    }

    unregister() {
        if (this._onClickListener) {
            this._map.off("contextmenu", this._onClickListener);
            this._map.off("click", this._onClickListener);
            this._onClickListener = undefined;
        }
        if (this._onMouseMoveListener) {
            this._map.off("click", this._onClickListener);
            this._onClickListener = undefined;
        }

        const selectedPane = this._map.getPane(this._selectedPane);
        if (selectedPane) {
            selectedPane.remove();
        }
    }

    render(
        changes: TerraDrawChanges,
        styling: { [mode: string]: TerraDrawAdapterStyling }
    ) {
        const features = [
            ...changes.created,
            ...changes.updated,
            ...changes.unchanged,
        ];

        if (this._layer) {
            this._map.removeLayer(this._layer);
        }

        const featureCollection = {
            type: "FeatureCollection",
            features,
        } as GeoJsonObject;

        const layer = this._lib.geoJSON(featureCollection, {
            // Style points - convert markers to circle markers
            pointToLayer: (feature: Feature, latlng: L.LatLngExpression) => {
                if (!feature.properties) {
                    throw new Error("Feature has no properties");
                }

                const mode = feature.properties.mode;
                const modeStyle = styling[mode];
                const isSelected =
                    feature.properties[SELECT_PROPERTIES.SELECTED] ||
                    feature.properties.selectionPoint;
                const isMidPoint = feature.properties[SELECT_PROPERTIES.MID_POINT];
                const isClosingPoint = feature.properties[POLYGON_PROPERTIES.CLOSING_POINT];

                console.log(isClosingPoint);

                const isAssistancePoint = isSelected || isMidPoint || isClosingPoint;

                const styles = {
                    radius: isSelected
                        ? modeStyle.selectionPointWidth
                        : isMidPoint
                            ? modeStyle.midPointWidth
                            : modeStyle.pointWidth,
                    fillColor: isSelected
                        ? modeStyle.selectedColor
                        : isMidPoint
                            ? modeStyle.midPointColor
                            : isClosingPoint ? modeStyle.closingPointColor : modeStyle.pointColor,
                    stroke: isAssistancePoint,
                    color: isSelected
                        ? modeStyle.selectedPointOutlineColor
                        : isMidPoint
                            ? modeStyle.midPointOutlineColor
                            : isClosingPoint ? modeStyle.closingPointOutlineColor : modeStyle.pointOutlineColor,
                    weight: isAssistancePoint ? 2 : 0,
                    fillOpacity: 0.8,
                    pane: isSelected
                        ? this._selectedPane
                        : isMidPoint
                            ? this._midPointPane :
                            isClosingPoint
                                ? this._closingPointPane
                                : undefined,
                    interactive: false, // Removes mouse hover cursor styles
                } as L.CircleMarkerOptions;

                console.log(styles);

                const marker = this._lib.circleMarker(latlng, styles);

                return marker;
            },

            // Style LineStrings and Polygons
            style: (feature) => {
                if (!feature || !feature.properties) {
                    return {};
                }

                const mode = feature.properties.mode;
                const modeStyle = styling[mode];

                if (feature.geometry.type === "LineString") {
                    return {
                        interactive: false, // Removes mouse hover cursor styles
                        color: feature.properties[SELECT_PROPERTIES.SELECTED]
                            ? modeStyle.selectedColor
                            : modeStyle.lineStringColor,

                        weight: modeStyle.lineStringWidth,
                    };
                } else if (feature.geometry.type === "Polygon") {
                    return {
                        interactive: false, // Removes mouse hover cursor styles
                        fillOpacity: modeStyle.polygonFillOpacity,
                        fillColor: feature.properties[SELECT_PROPERTIES.SELECTED]
                            ? modeStyle.selectedColor
                            : modeStyle.polygonFillColor,
                        weight: modeStyle.polygonOutlineWidth,
                        stroke: true,
                        color: feature.properties[SELECT_PROPERTIES.SELECTED]
                            ? modeStyle.selectedColor
                            : modeStyle.polygonOutlineColor,
                    };
                }

                return {};
            },
        });

        this._map.addLayer(layer);

        this._layer = layer;
    }
}
