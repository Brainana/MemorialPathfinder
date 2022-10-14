function generatePermutations(n, A, distanceMatrixResponse) {
    var distance;

    // c is an encoding of the stack state. c[k] encodes the for-loop counter for when generate(k - 1, A) is called
    var c = [];

    for (var i = 0; i < n; i++) {
        c[i] = 0
    }

    // console.log(A);
    calculateDistance(A, distanceMatrixResponse);
    
    // i acts similarly to a stack pointer
    i = 1;
    while (i < n) {
        if  (c[i] < i) {
            if (i%2 === 0) {
                // swap(A[0], A[i])
                swap(A, 0, i)
            } else {
                swap(A, c[i], i)
            }
            // console.log(A)
            calculateDistance(A, distanceMatrixResponse);
            // Swap has occurred ending the for-loop. Simulate the increment of the for-loop counter
            c[i] += 1
            // Simulate recursive call reaching the base case by bringing the pointer to the base case analog in the array
            i = 1
        } else {
            // Calling generate(i+1, A) has ended as the for-loop terminated. Reset the state and simulate popping the stack by incrementing the pointer.
            c[i] = 0
            i += 1
        }
    }
}

function swap(A, indexA, indexB) {
    let a = A[indexA];
    A[indexA] = A[indexB];
    A[indexB] = a;
}