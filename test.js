const testObj = ['a']

let index = 0
testObj.splice(index, 1)

if (testObj[index]) { console.log(testObj[index]) }
else if (testObj[index-1]) { console.log(testObj[index-1])}
else {console.log('nothing left in array')}