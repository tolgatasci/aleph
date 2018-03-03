import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { selectFacet } from 'src/selectors';


export const fetchSearchResults = asyncActionCreator(({ query }) => async dispatch => {
  const response = await endpoint.get('search', { params: query.toParams() });
  return { query, result: response.data };
}, { name: 'FETCH_SEARCH_RESULTS' });

export const fetchNextSearchResults = asyncActionCreator(({ query, result }) => async dispatch => {
  const response = await endpoint.get(result.next);
  return { query, result: response.data };
}, { name: 'FETCH_NEXT_SEARCH_RESULTS' });

const defaultFacetValuesLimit = 10;
const facetValuesLimitIncreaseStep = 10;

const _fetchFacet = async ({ query, field, fetchTotal, fetchValues, valuesLimit }) => {
  if (!query) return null
  const facetQuery = query
    .limit(0) // The limit of the results, not the facets.
    .clearFacets()
    .addFacet(field)
    .set('facet_total', fetchTotal)
    .set('facet_values', fetchValues)
    .set('facet_size', valuesLimit);
  const response = await endpoint.get('search', { params: facetQuery.toParams() });
  const result = response.data.facets[field];
  return result;
}

export const fetchFacet = asyncActionCreator(({ query, field, fetchTotal, fetchValues }) => async dispatch => {
  const valuesLimit = defaultFacetValuesLimit;
  const result = await _fetchFacet({ query, field, fetchTotal, fetchValues, valuesLimit });
  return { query, field, fetchTotal, fetchValues, result, valuesLimit };
}, { name: 'FETCH_FACET' });

export const fetchNextFacetValues = asyncActionCreator(({ query, field }) => async (dispatch, getState) => {
  // There is no back-end API for fetching subsequent facet values. We simply
  // run a new query with a higher limit.
  const prevLimit = selectFacet(getState(), { query, field }).valuesLimit;
  const valuesLimit = prevLimit + facetValuesLimitIncreaseStep;
  const result = await _fetchFacet({ query, field, fetchTotal: false, fetchValues: true, valuesLimit });
  return { query, field, result, valuesLimit };
}, { name: 'FETCH_NEXT_FACET_VALUES' });

export const fetchEntity = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`entities/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITY' });

export const fetchEntityReferences = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`entities/${id}/references`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITY_REFERENCES' });

export const fetchEntityTags = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`entities/${id}/tags`);
  return { id, data: response.data };
}, { name: 'FETCH_ENTITY_TAGS' });