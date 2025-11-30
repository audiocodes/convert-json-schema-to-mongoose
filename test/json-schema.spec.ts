import { describe, it, expect } from 'vitest';
import _ from 'lodash';
import mongoose from 'mongoose';
import createMongooseSchema from '../lib/json-schema.js';

describe('mongoose schema conversion:', () => {
  describe('createMongooseSchema', () => {
    _.each([
      {type: 'objectttttt'},
      {type: 'object', properties: 'not an object'},
      {type: 'object', properties: {email: {type: 'not a type'}}}
    ], (invalid) => {
      it('throws when the incorrect type is given', () => {
        expect(() => {
          createMongooseSchema(void 0, invalid);
        }).toThrowError(/Unsupported JSON schema/);
      });
    });

    _.each([
      {type: 'object', properties: {id: {$ref: '#/nope/nope/nope'}}}
    ], (invalid) => {
      it('throws on unsupported ref, ' + JSON.stringify(invalid), () => {
        expect(() => {
          createMongooseSchema(void 0, invalid);
        }).toThrowError(/Unsupported .ref/);
      });
    });

    it('should convert a valid json-schema', () => {
      const refs = {
        yep: {type: 'string', pattern: '^\\d{3}$'},
        a: {
          type: 'array',
          items: {type: 'object', properties: {num: {type: 'number'}, str: {type: 'string'}}}
        },
        anyValue: {description: 'This can be any value.'},
        idSpec: {type: 'object', properties: {id: {$ref: 'yep'}, arr: {$ref: 'a'}}}
      };

      const valid = {
        type: 'object',
        properties: {
          id: {$ref: 'yep'},
          arr: {$ref: 'a'},
          anyValue: {a: 'b'},
          address: {
            type: 'object',
            properties: {
              street: {type: 'integer', default: 44, minimum: 0, maximum: 50},
              houseColor: {type: 'string', default: '[Function=Date.now]', format: 'date-time'}
            }
          }
        }
      };

      expect(createMongooseSchema(refs, valid)).toEqual({
        id: {type: String, match: /^\d{3}$/},
        arr: [{num: {type: Number}, str: {type: String}}],
        anyValue: mongoose.Schema.Types.Mixed,
        address: {
          street: {type: Number, default: 44, min: 0, max: 50},
          houseColor: {type: Date, default: Date.now}
        }
      });
    });
  });
});
