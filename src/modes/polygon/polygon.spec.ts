import { TerraDrawMouseEvent } from "../../common";
import { GeoJSONStore } from "../../store/store";
import { getMockModeConfig } from "../../test/mock-config";
import { getDefaultStyling } from "../../util/styling";
import { TerraDrawPolygonMode } from "./polygon.mode";

describe("TerraDrawPolygonMode", () => {
  const defaultStyles = getDefaultStyling();

  describe("constructor", () => {
    it("constructs with no options", () => {
      const polygonMode = new TerraDrawPolygonMode();
      expect(polygonMode.mode).toBe("polygon");
      expect(polygonMode.styling).toStrictEqual(defaultStyles);
    });

    it("constructs with options", () => {
      const polygonMode = new TerraDrawPolygonMode({
        styling: { pointOutlineColor: "#ffffff" },
        allowSelfIntersections: true,
        pointerDistance: 40,
        keyEvents: {
          cancel: "Backspace",
        },
      });
      expect(polygonMode.styling).toStrictEqual({
        ...defaultStyles,
        pointOutlineColor: "#ffffff",
      });
    });
  });

  describe("lifecycle", () => {
    it("registers correctly", () => {
      const polygonMode = new TerraDrawPolygonMode();
      expect(polygonMode.state).toBe("unregistered");
      polygonMode.register(getMockModeConfig(polygonMode.mode));
      expect(polygonMode.state).toBe("registered");
    });

    it("setting state directly throws error", () => {
      const polygonMode = new TerraDrawPolygonMode();

      expect(() => {
        polygonMode.state = "started";
      }).toThrowError();
    });

    it("stopping before not registering throws error", () => {
      const polygonMode = new TerraDrawPolygonMode();

      expect(() => {
        polygonMode.stop();
      }).toThrowError();
    });

    it("starting before not registering throws error", () => {
      const polygonMode = new TerraDrawPolygonMode();

      expect(() => {
        polygonMode.start();
      }).toThrowError();
    });

    it("starting before not registering throws error", () => {
      const polygonMode = new TerraDrawPolygonMode();

      expect(() => {
        polygonMode.start();
      }).toThrowError();
    });

    it("registering multiple times throws an error", () => {
      const polygonMode = new TerraDrawPolygonMode();

      expect(() => {
        polygonMode.register(getMockModeConfig(polygonMode.mode));
        polygonMode.register(getMockModeConfig(polygonMode.mode));
      }).toThrowError();
    });

    it("can start correctly", () => {
      const polygonMode = new TerraDrawPolygonMode();

      polygonMode.register(getMockModeConfig(polygonMode.mode));
      polygonMode.start();

      expect(polygonMode.state).toBe("started");
    });

    it("can stop correctly", () => {
      const polygonMode = new TerraDrawPolygonMode();

      polygonMode.register(getMockModeConfig(polygonMode.mode));
      polygonMode.start();
      polygonMode.stop();

      expect(polygonMode.state).toBe("stopped");
    });
  });

  describe("onMouseMove", () => {
    let polygonMode: TerraDrawPolygonMode;
    let store: GeoJSONStore;
    let onChange: jest.Mock;

    beforeEach(() => {
      store = new GeoJSONStore();
      polygonMode = new TerraDrawPolygonMode();
      const mockConfig = getMockModeConfig(polygonMode.mode);

      store = mockConfig.store;
      onChange = mockConfig.onChange;

      polygonMode.register(mockConfig);
    });

    it("does nothing if no clicks have occurred ", () => {
      polygonMode.onMouseMove({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      expect(onChange).not.toBeCalled();
    });

    it("updates the coordinate to the mouse position after first click", () => {
      polygonMode.onClick({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onMouseMove({
        lng: 1,
        lat: 1,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      expect(onChange).toBeCalledTimes(2);

      const features = store.copyAll();
      expect(features.length).toBe(1);

      expect(features[0].geometry.coordinates).toStrictEqual([
        [
          [0, 0],
          [1, 1],
          [1, 1.000001], // Small offset to keep Mapbox GL happy
          [0, 0],
        ],
      ]);
    });

    it("updates the coordinate to the mouse position after second click", () => {
      polygonMode.onClick({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onMouseMove({
        lng: 1,
        lat: 1,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onClick({
        lng: 1,
        lat: 1,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onMouseMove({
        lng: 2,
        lat: 2,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      expect(onChange).toBeCalledTimes(4);

      const features = store.copyAll();
      expect(features.length).toBe(1);

      expect(features[0].geometry.coordinates).toStrictEqual([
        [
          [0, 0],
          [1, 1],
          [2, 2],
          [0, 0],
        ],
      ]);
    });

    it("updates the coordinate to the mouse position after third click", () => {
      polygonMode.onClick({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onMouseMove({
        lng: 1,
        lat: 1,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onClick({
        lng: 1,
        lat: 1,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onMouseMove({
        lng: 2,
        lat: 2,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onClick({
        lng: 2,
        lat: 2,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onMouseMove({
        lng: 3,
        lat: 3,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      expect(onChange).toBeCalledTimes(6);

      const features = store.copyAll();
      expect(features.length).toBe(1);

      expect(features[0].geometry.coordinates).toStrictEqual([
        [
          [0, 0],
          [1, 1],
          [2, 2],
          [3, 3],
          [0, 0],
        ],
      ]);
    });
  });

  describe("onClick", () => {
    let polygonMode: TerraDrawPolygonMode;
    let store: GeoJSONStore;
    let project: jest.Mock;
    let unproject: jest.Mock;

    const mockClickBoundingBox = (
      bbox: [
        [number, number],
        [number, number],
        [number, number],
        [number, number]
      ] = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ]
    ) => {
      unproject
        .mockReturnValueOnce({ lng: bbox[0][0], lat: bbox[0][1] })
        .mockReturnValueOnce({ lng: bbox[1][0], lat: bbox[1][1] })
        .mockReturnValueOnce({ lng: bbox[2][0], lat: bbox[2][1] })
        .mockReturnValueOnce({ lng: bbox[3][0], lat: bbox[3][1] })
        .mockReturnValueOnce({ lng: bbox[0][0], lat: bbox[0][1] });
    };

    beforeEach(() => {
      polygonMode = new TerraDrawPolygonMode();
      const mockConfig = getMockModeConfig(polygonMode.mode);

      store = mockConfig.store;
      project = mockConfig.project;
      unproject = mockConfig.project;
      polygonMode.register(mockConfig);
    });

    it("can create a polygon", () => {
      polygonMode.onClick({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onMouseMove({
        lng: 1,
        lat: 1,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onClick({
        lng: 1,
        lat: 1,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onMouseMove({
        lng: 2,
        lat: 2,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onClick({
        lng: 2,
        lat: 2,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onMouseMove({
        lng: 3,
        lat: 3,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      project.mockReturnValueOnce({ x: 0, y: 0 });

      polygonMode.onClick({
        lng: 3,
        lat: 3,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      project.mockReturnValueOnce({ x: 0, y: 0 });

      polygonMode.onClick({
        lng: 3,
        lat: 3,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      let features = store.copyAll();
      expect(features.length).toBe(2);

      // Create a new polygon
      polygonMode.onClick({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      features = store.copyAll();
      expect(features.length).toBe(2);
    });

    it("can create a polygon with snapping enabled", () => {
      polygonMode = new TerraDrawPolygonMode({ snapping: true });
      const mockConfig = getMockModeConfig(polygonMode.mode);
      store = mockConfig.store;
      project = mockConfig.project;
      unproject = mockConfig.unproject;
      polygonMode.register(mockConfig);

      mockClickBoundingBox();
      polygonMode.onClick({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      mockClickBoundingBox();
      polygonMode.onMouseMove({
        lng: 1,
        lat: 1,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      mockClickBoundingBox();
      polygonMode.onClick({
        lng: 1,
        lat: 1,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      mockClickBoundingBox();
      polygonMode.onMouseMove({
        lng: 2,
        lat: 2,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      mockClickBoundingBox();
      polygonMode.onClick({
        lng: 2,
        lat: 2,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      mockClickBoundingBox();
      polygonMode.onMouseMove({
        lng: 3,
        lat: 3,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      project.mockReturnValueOnce({ x: 0, y: 0 });

      mockClickBoundingBox();
      polygonMode.onClick({
        lng: 3,
        lat: 3,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      let features = store.copyAll();
      expect(features.length).toBe(1);

      mockClickBoundingBox();
      project
        .mockReturnValueOnce({ x: 0, y: 0 })
        .mockReturnValueOnce({ x: 0, y: 0 })
        .mockReturnValueOnce({ x: 0, y: 0 })
        .mockReturnValueOnce({ x: 0, y: 0 });

      // Create a new polygon
      polygonMode.onClick({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      features = store.copyAll();
      expect(features.length).toBe(2);
    });

    it("can update polygon past 3 coordinates", () => {
      polygonMode.onClick({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onMouseMove({
        lng: 1,
        lat: 1,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onClick({
        lng: 1,
        lat: 1,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onMouseMove({
        lng: 2,
        lat: 2,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onClick({
        lng: 2,
        lat: 2,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onMouseMove({
        lng: 3,
        lat: 3,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      project.mockReturnValueOnce({ x: 100, y: 100 });

      polygonMode.onClick({
        lng: 3,
        lat: 3,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      polygonMode.onMouseMove({
        lng: 4,
        lat: 4,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      project.mockReturnValueOnce({ x: 100, y: 100 });

      polygonMode.onClick({
        lng: 4,
        lat: 4,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      let features = store.copyAll();
      expect(features.length).toBe(1);
      expect(features[0].geometry.coordinates).toStrictEqual([
        [
          [0, 0],
          [1, 1],
          [2, 2],
          [3, 3],
          [4, 4],
          [4, 4],
          [0, 0],
        ],
      ]);

      project.mockReturnValueOnce({ x: 0, y: 0 });

      polygonMode.onClick({
        lng: 4,
        lat: 4,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      features = store.copyAll();
      expect(features.length).toBe(1);
      expect(features[0].geometry.coordinates).toStrictEqual([
        [
          [0, 0],
          [1, 1],
          [2, 2],
          [3, 3],
          [4, 4],

          [0, 0],
        ],
      ]);
    });

    it("does not create a polygon line if it has intersections and allowSelfIntersections is false", () => {
      polygonMode = new TerraDrawPolygonMode({ allowSelfIntersections: false });
      const mockConfig = getMockModeConfig(polygonMode.mode);

      store = mockConfig.store;
      project = mockConfig.project;

      polygonMode.register(mockConfig);

      const coordOneEvent = {
        lng: 11.162109375,
        lat: 23.322080011,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      } as TerraDrawMouseEvent;
      polygonMode.onClick(coordOneEvent);

      const coordTwoEvent = {
        lng: -21.884765625,
        lat: -8.928487062,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      } as TerraDrawMouseEvent;
      polygonMode.onMouseMove(coordTwoEvent);
      polygonMode.onClick(coordTwoEvent);

      const coordThreeEvent = {
        lng: 26.894531249,
        lat: -20.468189222,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      } as TerraDrawMouseEvent;
      polygonMode.onMouseMove(coordThreeEvent);
      polygonMode.onClick(coordThreeEvent);

      // Overlapping point
      const coordFourEvent = {
        lng: -13.974609375,
        lat: 22.187404991,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      } as TerraDrawMouseEvent;
      project.mockReturnValueOnce({ x: 100, y: 100 });
      polygonMode.onMouseMove(coordFourEvent);
      polygonMode.onClick(coordFourEvent);

      let features = store.copyAll();
      expect(features.length).toBe(1);

      // Here we still have the coordinate but it's not committed
      // to the finished polygon
      expect(features[0].geometry.coordinates).toStrictEqual([
        [
          [11.162109375, 23.322080011],
          [-21.884765625, -8.928487062],
          [26.894531249, -20.468189222],
          [-13.974609375, 22.187404991],
          [11.162109375, 23.322080011],
        ],
      ]);

      const closingCoordEvent = {
        ...coordOneEvent,
      };
      polygonMode.onMouseMove(closingCoordEvent);
      project.mockReturnValueOnce({ x: 0, y: 0 });
      polygonMode.onClick(closingCoordEvent);

      features = store.copyAll();
      expect(features.length).toBe(1);
      expect(project).toBeCalledTimes(2);

      // The overlapping coordinate is not included
      expect(features[0].geometry.coordinates).toStrictEqual([
        [
          [11.162109375, 23.322080011],
          [-21.884765625, -8.928487062],
          [26.894531249, -20.468189222],
          [11.162109375, 23.322080011],
        ],
      ]);
    });
  });

  describe("onKeyUp", () => {
    let store: GeoJSONStore;
    let polygonMode: TerraDrawPolygonMode;

    beforeEach(() => {
      jest.resetAllMocks();

      polygonMode = new TerraDrawPolygonMode();

      const mockConfig = getMockModeConfig(polygonMode.mode);

      store = mockConfig.store;

      polygonMode.register(mockConfig);
    });

    it("Escape - does nothing when no line is present", () => {
      polygonMode.onKeyUp({ key: "Escape" });
    });

    it("Escape - deletes the line when currently editing", () => {
      polygonMode.onClick({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      let features = store.copyAll();
      expect(features.length).toBe(1);

      polygonMode.onKeyUp({ key: "Escape" });

      features = store.copyAll();
      expect(features.length).toBe(0);
    });
  });

  describe("cleanUp", () => {
    let store: GeoJSONStore;
    let polygonMode: TerraDrawPolygonMode;
    let onChange: jest.Mock;
    let project: jest.Mock;

    beforeEach(() => {
      jest.resetAllMocks();
      polygonMode = new TerraDrawPolygonMode();

      const mockConfig = getMockModeConfig(polygonMode.mode);
      store = mockConfig.store;
      onChange = mockConfig.onChange;
      project = mockConfig.project;

      polygonMode.register(mockConfig);
    });

    it("does not throw error if feature has not been created ", () => {
      expect(() => {
        polygonMode.cleanUp();
      }).not.toThrowError();
    });

    it("cleans up correctly if drawing has started", () => {
      polygonMode.onClick({
        lng: 0,
        lat: 0,
        containerX: 0,
        containerY: 0,
        button: "left",
        heldKeys: [],
      });

      expect(store.copyAll().length).toBe(1);

      polygonMode.cleanUp();

      // Removes the LineString that was being created
      expect(store.copyAll().length).toBe(0);
    });
  });

  describe("onDrag", () => {
    it("does nothing", () => {
      const polygonMode = new TerraDrawPolygonMode();
      polygonMode.register(getMockModeConfig(polygonMode.mode));

      expect(() => {
        polygonMode.onDrag();
      }).not.toThrowError();
    });
  });

  describe("onDragStart", () => {
    it("does nothing", () => {
      const polygonMode = new TerraDrawPolygonMode();
      polygonMode.register(getMockModeConfig(polygonMode.mode));

      expect(() => {
        polygonMode.onDragStart();
      }).not.toThrowError();
    });
  });

  describe("onDragEnd", () => {
    it("does nothing", () => {
      const polygonMode = new TerraDrawPolygonMode();
      polygonMode.register(getMockModeConfig(polygonMode.mode));

      expect(() => {
        polygonMode.onDragEnd();
      }).not.toThrowError();
    });
  });

  describe("styling", () => {
    it("gets", () => {
      const polygonMode = new TerraDrawPolygonMode();
      polygonMode.register(getMockModeConfig(polygonMode.mode));

      expect(polygonMode.styling).toStrictEqual(getDefaultStyling());
    });

    it("set fails if non valid styling", () => {
      const polygonMode = new TerraDrawPolygonMode();
      polygonMode.register(getMockModeConfig(polygonMode.mode));

      expect(() => {
        (polygonMode.styling as unknown) = "test";
      }).toThrowError();

      expect(polygonMode.styling).toStrictEqual(getDefaultStyling());
    });

    it("sets", () => {
      const polygonMode = new TerraDrawPolygonMode();
      polygonMode.register(getMockModeConfig(polygonMode.mode));

      const newStyling = {
        ...getDefaultStyling(),
        polygonFillColor: "#fffff",
      };

      polygonMode.styling = { ...newStyling };

      expect(polygonMode.styling).toStrictEqual(newStyling);
    });
  });
});