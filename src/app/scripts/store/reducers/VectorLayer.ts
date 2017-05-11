import * as _ from 'lodash';
import { createSelector } from 'reselect';
import { VectorLayer } from '../../layers';
import * as vectorLayer from '../actions/VectorLayer';

export interface State {
  // TODO: not sure it makes sense to have a list of vectors anymore
  // (i.e. how should add layer work?)
  readonly vectorLayers: ReadonlyArray<VectorLayer>;
  readonly selectedLayerIds: Set<string>;
  readonly collapsedLayerIds: Set<string>;
  readonly hiddenLayerIds: Set<string>;
}

export const initialState: State = {
  vectorLayers: [],
  selectedLayerIds: new Set<string>(),
  collapsedLayerIds: new Set<string>(),
  hiddenLayerIds: new Set<string>(),
};

export function reducer(state = initialState, action: vectorLayer.Actions): State {
  switch (action.type) {
    case vectorLayer.ADD_VECTOR_LAYERS: {
      const vectorLayers = state.vectorLayers.concat(...action.payload.vectorLayers);
      return { ...state, vectorLayers };
    }
    case vectorLayer.REPLACE_VECTOR_LAYER: {
      const replacement = action.payload.vectorLayer;
      const replacementId = replacement.id;
      const vectorLayers =
        state.vectorLayers.map(vl => vl.id === replacementId ? replacement : vl);
      return { ...state, vectorLayers };
    }
    case vectorLayer.SELECT_LAYER_ID: {
      const { layerId, clearExisting } = action.payload;
      const selectedLayerIds = clearExisting ? new Set() : new Set(state.selectedLayerIds);
      selectedLayerIds.add(layerId);
      return { ...state, selectedLayerIds };
    }
    case vectorLayer.TOGGLE_LAYER_ID_EXPANSION: {
      const { layerId, recursive } = action.payload;
      const layerIds = new Set([layerId]);
      if (recursive) {
        _.forEach(state.vectorLayers, vl => {
          // Recursively expand/collapse the layer's children.
          const layer = vl.findLayerById(layerId);
          if (!layer) {
            return true;
          }
          layer.walk(l => layerIds.add(l.id));
          return false;
        });
      }
      const collapsedLayerIds = new Set(state.collapsedLayerIds);
      if (collapsedLayerIds.has(layerId)) {
        layerIds.forEach(id => collapsedLayerIds.delete(id));
      } else {
        layerIds.forEach(id => collapsedLayerIds.add(id));
      }
      return { ...state, collapsedLayerIds };
    }
    case vectorLayer.TOGGLE_LAYER_ID_VISIBILITY: {
      const { layerId } = action.payload;
      const hiddenLayerIds = new Set(state.hiddenLayerIds);
      if (hiddenLayerIds.has(layerId)) {
        hiddenLayerIds.delete(layerId);
      } else {
        hiddenLayerIds.add(layerId);
      }
      return { ...state, hiddenLayerIds };
    }
    case vectorLayer.ADD_LAYER: {
      if (!state.vectorLayers.length) {
        // TODO: don't allow the user to add a layer if no vector layers exist?
        return state;
      }
      // TODO: add the layer below the currently selected layer, if one exists
      const { layer } = action.payload;
      // TODO: assign the layer a unique name that doesn't clash with any others
      // layer.name = 'TODO: fix this';
      const vl = state.vectorLayers[0].clone();
      vl.children = vl.children.concat(layer);
      const vectorLayers = state.vectorLayers.slice();
      vectorLayers[0] = vl;
      return { ...state, vectorLayers };
    }
    default: {
      return state;
    }
  }
}
