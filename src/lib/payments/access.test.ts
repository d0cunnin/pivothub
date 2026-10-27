import {describe,it,expect} from 'vitest';
import {hasToolAccess} from '@/utils/packageAccess';
describe('Credit-based access',()=>{
 it('Starter has access to Create It, not a restricted tool bundle',()=>expect(hasToolAccess('starter','create-it-blueprint',true)).toBe(true));
 it('Free plan has the same tool access subject to server credit balance',()=>expect(hasToolAccess(null,'grant-content',false)).toBe(true));
});